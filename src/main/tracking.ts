import { execSync } from 'child_process'
import { ActiveWindowInfo, MainToRendererChannel } from './entities'
import { createHash } from 'crypto'
import os from 'os'
import fs from 'fs'

let interval

export const startTracking = (mainWindow: any) => {
  interval = setInterval(async () => {
    const tracking = await trackActiveWindow()
    const event: MainToRendererChannel = 'window-info'
    mainWindow.webContents.send(event, tracking)
  }, 1000)
}

export const endTracking = () => {
  clearInterval(interval)
}

const trackActiveWindow = async (): Promise<ActiveWindowInfo> => {
  const platform = os.platform()

  let activeWindowInfo: Omit<ActiveWindowInfo, 'id'> | undefined
  if (platform === 'win32') {
    activeWindowInfo = await trackActiveWindow_Windows()
  }
  if (platform === 'darwin') {
    activeWindowInfo = trackActiveWindow_Mac()
  }
  if (platform === 'linux') {
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
    const koffi = await import('koffi')

    // Define the Windows API functions and data types
    const user32 = koffi.load('user32.dll')

    const kernel32 = koffi.load('kernel32.dll')

    // Define the Windows API function signatures
    const GetForegroundWindow = user32.func('HWND GetForegroundWindow()')
    const GetWindowTextW = user32.func('int GetWindowTextW(HWND, WCHAR*, int)')
    const GetWindowThreadProcessId = user32.func('DWORD GetWindowThreadProcessId(HWND, DWORD*)')
    const GetClassNameW = user32.func('int GetClassNameW(HWND, WCHAR*, int)')
    const OpenProcess = kernel32.func('HANDLE OpenProcess(DWORD, BOOL, DWORD)')
    const QueryFullProcessImageNameW = kernel32.func(
      'BOOL QueryFullProcessImageNameW(HANDLE, DWORD, WCHAR*, DWORD*)'
    )
    const CloseHandle = kernel32.func('BOOL CloseHandle(HANDLE)')

    const hwnd = GetForegroundWindow()
    if (!hwnd) {
      throw new Error('Error getting active window info')
    }

    const titleBuffer = koffi.alloc('WCHAR', 256)
    const titleLength = GetWindowTextW(hwnd, titleBuffer, 256)
    const title = titleLength > 0 ? koffi.decode(titleBuffer, 'ucs2') : ''

    const pidBuffer = koffi.alloc('DWORD', 1)
    GetWindowThreadProcessId(hwnd, pidBuffer)
    const pid = pidBuffer.readUInt32LE()

    const classNameBuffer = koffi.alloc('WCHAR', 256)
    const classNameLength = GetClassNameW(hwnd, classNameBuffer, 256)
    const className = classNameLength > 0 ? koffi.decode(classNameBuffer, 'ucs2') : ''

    const processHandle = OpenProcess(0x1000, false, pid)
    if (!processHandle) {
      return { title, className, allData: JSON.stringify(hwnd), executable: '' }
    }

    const exeBuffer = koffi.alloc('WCHAR', 1024)
    const exeBufferSize = koffi.alloc('DWORD', 1)
    const result = QueryFullProcessImageNameW(processHandle, 0, exeBuffer, exeBufferSize)
    const executable = result ? koffi.decode(exeBuffer, 'ucs2') : ''
    CloseHandle(processHandle)

    return { title, executable, className, allData: JSON.stringify(hwnd) }
  } catch (error) {
    const errorMessage = 'Error getting active window info: ' + error
    console.error(errorMessage)
    fs.writeFileSync('error.txt', errorMessage)
    return undefined
  }
  return
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
