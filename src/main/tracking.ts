import { execSync } from 'child_process'
import { ActiveWindowInfo, MainToRendererChannel } from './entities'
import { createHash } from 'crypto'
import os from 'os'
import fs from 'fs'

let interval

export const startTracking = (mainWindow: any) => {
  interval = setInterval(async () => {
    const tracking = await trackActiveWindow()
    const event: MainToRendererChannel = 'send-window-info'
    mainWindow.webContents.send(event, tracking)
  }, 1000)
}

export const endTracking = () => {
  clearInterval(interval)
}

export const detectOS = () => {
  const platform = os.platform()

  return platform
}

const trackActiveWindow = async (): Promise<ActiveWindowInfo> => {
  const platform = os.platform()

  let activeWindowInfo: Omit<ActiveWindowInfo, 'id'> | undefined
  if (platform === 'win32') {
    activeWindowInfo = await trackActiveWindow_Windows()
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

  const id = createHash('md5').update(JSON.stringify(activeWindowInfo)).digest('hex')

  console.log(activeWindowInfo.allData)

  //ignore
  // @ts-ignore
  delete activeWindowInfo.allData

  return { ...activeWindowInfo, id }
}

const trackActiveWindow_Windows = async (): Promise<Omit<ActiveWindowInfo, 'id'> | undefined> => {
  try {
    const { default: koffi } = await import('koffi')

    // Load Windows API libraries
    const user32 = koffi.load('user32.dll')
    const kernel32 = koffi.load('kernel32.dll')

    // Define Windows API function signatures
    const GetForegroundWindow = user32.func('HWND GetForegroundWindow()')
    const GetWindowTextW = user32.func('int GetWindowTextW(HWND, WCHAR*, int)')
    const GetWindowThreadProcessId = user32.func('DWORD GetWindowThreadProcessId(HWND, DWORD*)')
    const GetClassNameW = user32.func('int GetClassNameW(HWND, WCHAR*, int)')
    const OpenProcess = kernel32.func('HANDLE OpenProcess(DWORD, BOOL, DWORD)')
    const QueryFullProcessImageNameW = kernel32.func(
      'BOOL QueryFullProcessImageNameW(HANDLE, DWORD, WCHAR*, DWORD*)'
    )
    const CloseHandle = kernel32.func('BOOL CloseHandle(HANDLE)')

    // Get the active window handle
    const hwnd = GetForegroundWindow()
    if (!hwnd) {
      throw new Error('Error getting active window info')
    }

    // Get window title
    const titleBuffer = koffi.alloc('WCHAR', 256)
    const titleLength = GetWindowTextW(hwnd, titleBuffer, 256)
    const title = titleLength > 0 ? koffi.decode(titleBuffer, 'ucs2') : ''

    // Get process ID
    const pidBuffer = koffi.alloc('DWORD', 1)
    GetWindowThreadProcessId(hwnd, pidBuffer)
    const pid = pidBuffer.readUInt32LE(0)

    // Get window class name
    const classNameBuffer = koffi.alloc('WCHAR', 256)
    const classNameLength = GetClassNameW(hwnd, classNameBuffer, 256)
    const className = classNameLength > 0 ? koffi.decode(classNameBuffer, 'ucs2') : ''

    // Open the process
    const PROCESS_QUERY_INFORMATION = 0x0400
    const PROCESS_VM_READ = 0x0010
    const processHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, false, pid)

    if (!processHandle || processHandle.address === 0) {
      console.error('Failed to open process for PID:', pid)
      return { title, className, allData: JSON.stringify(hwnd), executable: '' }
    }

    // Get executable path
    const exeBuffer = koffi.alloc('WCHAR', 1024)
    const exeBufferSize = koffi.alloc('DWORD', 1)
    exeBufferSize.writeUInt32LE(1024, 0)

    const result = QueryFullProcessImageNameW(processHandle, 0, exeBuffer, exeBufferSize)
    const exePathLength = exeBufferSize.readUInt32LE(0)
    const executable = result ? koffi.decode(exeBuffer.slice(0, exePathLength * 2), 'ucs2') : ''

    // Close process handle
    CloseHandle(processHandle)

    return { title, executable, className, allData: JSON.stringify(hwnd) }
  } catch (error) {
    const errorMessage = 'Error getting active window info: ' + error
    console.error(errorMessage)
    fs.writeFileSync('error.txt', errorMessage)
    return undefined
  }
}

const trackActiveWindow_Mac = (): undefined => {
  throw new Error('OS still under development')
  // return
  //TODO to be implemented
}

const trackActiveWindow_Linux = (): Omit<ActiveWindowInfo, 'id'> | undefined => {
  try {
    const allData = execSync(`xprop -id $(xprop -root _NET_ACTIVE_WINDOW | awk '{print $5}')`)
      .toString()
      .trim()
    const windowId = execSync("xprop -root _NET_ACTIVE_WINDOW | awk '{print $5}'").toString().trim()
    const title = execSync(`xprop -id ${windowId} _NET_WM_NAME | awk -F\\" '{print $2}'`)
      .toString()
      .trim()
    const className = execSync(`xprop -id ${windowId} WM_CLASS | awk -F\\" '{print $2}'`)
      .toString()
      .trim()
    const pid = execSync(`xprop -id ${windowId} _NET_WM_PID | awk '{print $3}'`).toString().trim()
    const executable = execSync(`ps -p ${pid} -o comm=`).toString().trim()

    return { title, executable, className, allData }
  } catch (error) {
    const errorMessage = 'Error getting active window info: ' + error
    console.error(errorMessage)
    fs.writeFileSync('error.txt', errorMessage)
    return undefined
  }
}
