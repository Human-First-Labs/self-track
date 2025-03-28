import { execSync } from 'child_process'
import { ActiveWindowInfo, ActiveWindowInfoOnly } from './entities'
import os from 'os'
import fs from 'fs'
import koffi, { KoffiFunction } from 'koffi'
import { DataWriter } from './data-consolidation'
import { InteractionTracker } from './interaction-tracking'
import { createHash } from 'crypto'

interface WindowsPrepWork {
  //TODO all the functions used by Windows
  GetForegroundWindow: KoffiFunction
  GetWindowThreadProcessId: KoffiFunction
  GetWindowTextA: KoffiFunction
  GetClassNameA: KoffiFunction
  OpenProcess: KoffiFunction
  QueryFullProcessImageNameA: KoffiFunction
  CloseHandle: KoffiFunction
  GetLastError: KoffiFunction
}

const resetForOs = (): void => {
  const platform = os.platform()

  if (platform === 'win32') {
    resetForOs_Windows()
  }

  DataWriter.closeCSV()
}

const resetForOs_Windows = (): void => {
  koffi.reset()
}

const prepForOs = (): WindowsPrepWork | undefined => {
  const platform = os.platform()

  let setup: WindowsPrepWork | undefined = undefined

  if (platform === 'win32') {
    setup = prepForOs_Windows()
  }

  return setup
}

const prepForOs_Windows = (): WindowsPrepWork => {
  // Define Windows-specific types
  const HANDLE = koffi.pointer('HANDLE', koffi.opaque())
  koffi.alias('HWND', HANDLE)
  koffi.alias('DWORD', 'uint32_t')

  // Load Windows API libraries
  const user32 = koffi.load('user32.dll')
  const kernel32 = koffi.load('kernel32.dll')

  const GetForegroundWindow = user32.func('HWND GetForegroundWindow()')
  const GetWindowThreadProcessId = user32.func(
    'DWORD __stdcall GetWindowThreadProcessId(HWND hWnd, _Out_ DWORD *lpdwProcessId)'
  )
  const GetWindowTextA = user32.func(
    'int __stdcall GetWindowTextA(HWND hWnd, _Out_ uint8_t *lpString, int nMaxCount)'
  )
  const GetClassNameA = user32.func(
    'int __stdcall GetClassNameA(HWND hWnd, _Out_ uint8_t *lpString, int nMaxCount)'
  )
  const OpenProcess = kernel32.func(
    'HANDLE OpenProcess(DWORD dwDesiredAccess, bool bInheritHandle, DWORD dwProcessId)'
  )
  const QueryFullProcessImageNameA = kernel32.func(
    'int QueryFullProcessImageNameA(HANDLE hProcess, DWORD dwFlags, _Out_ uint8_t *lpExeName, int lpdwSize)'
  )

  const GetLastError = kernel32.func('DWORD GetLastError()')

  const CloseHandle = kernel32.func('int CloseHandle(HANDLE hObject)')

  return {
    GetForegroundWindow,
    GetWindowThreadProcessId,
    GetWindowTextA,
    GetClassNameA,
    OpenProcess,
    QueryFullProcessImageNameA,
    GetLastError,
    CloseHandle
  }
}

const trackActiveWindow = (args: WindowsPrepWork | undefined): ActiveWindowInfo => {
  const platform = os.platform()

  let activeWindowInfo: Omit<ActiveWindowInfoOnly, 'interactive'> | undefined

  if (platform === 'win32') {
    if (!args) {
      throw new Error('Args are missing!')
    }

    activeWindowInfo = trackActiveWindow_Windows(args)
  } else if (platform === 'darwin') {
    activeWindowInfo = trackActiveWindow_Mac()
  } else if (platform === 'linux') {
    activeWindowInfo = trackActiveWindow_Linux()
  } else {
    throw new Error('Unsupported OS')
  }

  if (!activeWindowInfo) {
    throw new Error('Error getting active window info')
  }

  const interaction = InteractionTracker.checkState()

  const info: ActiveWindowInfoOnly = {
    ...activeWindowInfo,
    interactive: interaction
  }

  const hash = createHash('md5').update(JSON.stringify(info)).digest('hex')

  return {
    hash,
    ...info
  }
}

const trackActiveWindow_Windows = (
  args: WindowsPrepWork
): Omit<ActiveWindowInfoOnly, 'interactive'> | undefined => {
  const {
    GetForegroundWindow,
    GetWindowThreadProcessId,
    GetWindowTextA,
    GetClassNameA,
    OpenProcess,
    // QueryFullProcessImageNameA,
    // GetLastError,
    CloseHandle
  } = args

  try {
    // Constants
    const PROCESS_QUERY_INFORMATION = 0x0400
    const PROCESS_VM_READ = 0x0010

    const hwnd = GetForegroundWindow()

    if (!hwnd || hwnd.address === 0) {
      console.warn('No foreground window found')
      return undefined
    }

    // Get window title
    const buf = Buffer.alloc(1024)
    const titleLength = GetWindowTextA(hwnd, buf, buf.length)
    if (!titleLength) {
      // Maybe the process ended in-between?
      throw new Error('Window Stopped somehow')
    }
    const title = koffi.decode(buf, 'char', titleLength)

    // Get process ID
    const ptr = [null]
    const tid = GetWindowThreadProcessId(hwnd, ptr)
    if (!tid) {
      // Maybe the process ended in-between?
      throw new Error('Window Stopped somehow')
    }
    const pid = ptr[0]

    // Get window class name
    const buf2 = Buffer.alloc(1024)
    const classNameLength = GetClassNameA(hwnd, buf2, buf2.length)
    if (!classNameLength) {
      // Maybe the process ended in-between?
      throw new Error('Window Stopped somehow')
    }
    const className = koffi.decode(buf2, 'char', classNameLength)

    // Open the process
    const processHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid)
    if (!processHandle || processHandle.address === 0) {
      // Maybe the process ended in-between?
      throw new Error(`Failed to open process for PID: ${pid}`)
    }

    // try{
    //   // Get executable path
    //   let buf3 = Buffer.alloc(1024);
    //   const executableLength = QueryFullProcessImageNameA(processHandle, 0, buf3, buf3.length);
    //   if (!executableLength) {
    //     // Maybe the process ended in-between?
    //     throw new Error('Window Stopped somehow')
    //   }
    //   const executable = koffi.decode(buf3, 'char', executableLength);

    // }catch(e){
    //   console.error('boop', e)
    //   const result = GetLastError()
    //   console.log('test2',result )

    // }
    // Close process handle
    CloseHandle(processHandle)

    return {
      className,
      title
    }
  } catch (error) {
    const errorMessage = `Error getting active window info: ${error}`
    console.error(errorMessage)

    try {
      fs.writeFileSync('window-tracking-error.log', errorMessage + '\n', { flag: 'a' })
    } catch (logError) {
      console.error('Failed to write error log:', logError)
    }

    return undefined
  }
}

const trackActiveWindow_Mac = (): undefined => {
  throw new Error('OS still under development')
  //TODO to be implemented
}

const trackActiveWindow_Linux = (): Omit<ActiveWindowInfoOnly, 'interactive'> | undefined => {
  try {
    const windowId = execSync("xprop -root _NET_ACTIVE_WINDOW | awk '{print $5}'").toString().trim()
    const title = execSync(`xprop -id ${windowId} _NET_WM_NAME | awk -F\\" '{print $2}'`)
      .toString()
      .trim()
    const className = execSync(`xprop -id ${windowId} WM_CLASS | awk -F\\" '{print $2}'`)
      .toString()
      .trim()
    const pid = execSync(`xprop -id ${windowId} _NET_WM_PID | awk '{print $3}'`).toString().trim()
    const executable = execSync(`ps -p ${pid} -o comm=`).toString().trim()

    return { title, executable, className }
  } catch (error) {
    const errorMessage = 'Error getting active window info: ' + error
    console.error(errorMessage)
    fs.writeFileSync('error.txt', errorMessage)
    return undefined
  }
}

export const Tracker = {
  resetForOs,
  prepForOs,
  trackActiveWindow
}
