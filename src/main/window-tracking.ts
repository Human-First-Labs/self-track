import { execSync } from 'child_process'
import { ActiveWindowInfo, ActiveWindowInfoOnly } from './entities'
import os from 'os'
import koffi, { inout, KoffiFunction, opaque, out, pointer } from 'koffi'
import { InteractionTracker } from './interaction-tracking'
import { createHash } from 'crypto'
import { PermissionChecks } from './permission-checker'

interface WindowsPrepWork {
  GetForegroundWindow: KoffiFunction
  GetWindowThreadProcessId: KoffiFunction
  GetWindowText: KoffiFunction
  // GetClassName: KoffiFunction
  OpenProcess: KoffiFunction
  QueryFullProcessImageName: KoffiFunction
  CloseHandle: KoffiFunction
}

const titleCleanUp = (title: string): string => {
  // Remove numbers in brackets (e.g., "[1]", "(2)")
  let cleanedText = title.replace(/[[(]\d+[\])]/g, '')
  // Remove special symbols like "●", "*", "•", etc.
  cleanedText = cleanedText.replace(/[●•*]/g, '')
  // Remove extra spaces
  return cleanedText.replace(/\s+/g, ' ').trim()
}

const resetForOs = (): void => {
  const platform = os.platform()

  if (platform === 'win32') {
    resetForOs_Windows()
  }
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
  const cHWND = pointer('HWND', opaque())
  type HANDLE<Kind extends string> = koffi.IKoffiCType & { __kind: Kind }
  type HWND = HANDLE<'HWND'>
  const cDWORD = koffi.types.uint32
  const cLPDWORD = pointer('LPDWORD', koffi.types.uint32)
  const cINT = koffi.types.int
  const cLPWSTR = koffi.types.str16
  const cHANDLE = pointer('HANDLE', opaque())
  const cBOOL = koffi.types.int

  // Load Windows API libraries
  const user32 = koffi.load('user32.dll')
  const kernel32 = koffi.load('kernel32.dll')

  const user32Function = user32.func
  const kernel32Function = kernel32.func

  const GetForegroundWindow: koffi.KoffiFunc<() => HWND> = user32Function(
    'GetForegroundWindow',
    cHWND,
    []
  )

  const GetWindowThreadProcessId = user32Function('GetWindowThreadProcessId', cDWORD, [
    cHWND,
    inout(cLPDWORD)
  ])

  const GetWindowText = user32Function('GetWindowTextW', cINT, [cHWND, out(cLPWSTR), cINT])

  // const GetClassName = user32Function('GetClassNameW', cINT, [cHWND, out(cLPWSTR), cINT])

  const OpenProcess = kernel32Function('OpenProcess', cHANDLE, [cDWORD, cBOOL, cDWORD])

  const QueryFullProcessImageName = kernel32Function('QueryFullProcessImageNameW', cBOOL, [
    cHANDLE,
    cDWORD,
    out(cLPWSTR),
    inout(cLPDWORD)
  ])

  const CloseHandle = kernel32Function('CloseHandle', cBOOL, [cHANDLE])

  return {
    GetForegroundWindow,
    GetWindowThreadProcessId,
    GetWindowText,
    // GetClassName,
    OpenProcess,
    QueryFullProcessImageName,
    CloseHandle
  }
}

const trackActiveWindow = (args: {
  prep: WindowsPrepWork | undefined
  permissionChecks: PermissionChecks
}): ActiveWindowInfo => {
  const { prep, permissionChecks } = args

  const platform = os.platform()

  let activeWindowInfo: Omit<ActiveWindowInfoOnly, 'interactive'> | undefined

  if (platform === 'win32') {
    if (!prep) {
      throw new Error('Prep are missing!')
    }

    activeWindowInfo = trackActiveWindow_Windows(prep)
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

  const interaction = permissionChecks.inputPermission
    ? InteractionTracker.checkState()
      ? 'active'
      : 'inactive'
    : 'unknown'

  const info: ActiveWindowInfoOnly = {
    ...activeWindowInfo,
    title: titleCleanUp(activeWindowInfo.title),
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
    GetWindowText,
    // GetClassName,
    OpenProcess,
    QueryFullProcessImageName,
    CloseHandle
  } = args

  const textDecoder = new TextDecoder('utf-16')

  try {
    // Constants
    const PROCESS_QUERY_INFORMATION = 0x0400
    const PROCESS_VM_READ = 0x0010

    const hwnd = GetForegroundWindow()

    if (!hwnd) {
      console.warn('No foreground window found')
      return undefined
    }

    // Get window title
    const out = new Uint16Array(512)
    const len = GetWindowText(hwnd, out, 512)
    const title = textDecoder.decode(out).slice(0, len)

    // Get process ID
    const out2 = [0] as [number]
    GetWindowThreadProcessId(hwnd, out2)
    const pid = out2[0]

    // Get window class name
    // const out3 = new Uint16Array(512)
    // const len2 = GetClassName(hwnd, out3, 512)
    // const className = textDecoder.decode(out3).slice(0, len2)

    // Open the process
    const processHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid)
    if (!processHandle) {
      // Maybe the process ended in-between?
      throw new Error(`Failed to open process for PID: ${pid}`)
    }

    // Get the full process image name

    const exeName = new Uint16Array(256)
    const dwSize = [exeName.length] as [number]
    const executable =
      QueryFullProcessImageName(processHandle, 0, exeName, dwSize) === 0
        ? undefined
        : textDecoder.decode(exeName).slice(0, dwSize[0])

    // Close process handle
    CloseHandle(processHandle)

    return {
      // className,
      title,
      executable
    }
  } catch (error) {
    const errorMessage = `Error getting active window info: ${error}`
    console.error(errorMessage)

    return undefined
  }
}

const trackActiveWindow_Mac = (): undefined => {
  throw new Error('OS still under development')
  //TODO to be implemented
}

const trackActiveWindow_Linux = (): Omit<ActiveWindowInfoOnly, 'interactive'> | undefined => {
  try {
    // Attempt to get the active window ID using xprop
    let windowId = execSync("xprop -root _NET_ACTIVE_WINDOW | awk '{print $5}'").toString().trim()
    let title = ''
    // let className = ''
    let pid = ''
    let executable = ''

    if (windowId !== '0x0') {
      // Try _NET_WM_NAME first, fallback to WM_NAME
      try {
        title = execSync(`xprop -id ${windowId} _NET_WM_NAME | awk -F\\" '{print $2}'`)
          .toString()
          .trim()
      } catch {
        title = execSync(`xprop -id ${windowId} WM_NAME | awk -F\\" '{print $2}'`).toString().trim()
      }

      // className = execSync(`xprop -id ${windowId} WM_CLASS | awk -F\\" '{print $2}'`)
      //   .toString()
      //   .trim()
      pid = execSync(`xprop -id ${windowId} _NET_WM_PID | awk '{print $3}'`).toString().trim()
      executable = execSync(`ps -p ${pid} -o comm=`).toString().trim()
    }

    if (!title 
      // || !className 
      || !pid) {
      const xwininfoOutput = execSync('xwininfo -root -tree').toString()
      const match = xwininfoOutput.match(/0x[0-9a-fA-F]+/)

      if (match) {
        windowId = match[0]

        // Use xwininfo to get additional details if xprop fails
        const xwininfoDetails = execSync(`xwininfo -id ${windowId}`).toString()
        // console.log('xwininfoDetails:', xwininfoDetails)

        const titleMatch = xwininfoDetails.match(/xwininfo: Window id: .* "(.*)"/)
        title = titleMatch ? titleMatch[1] : ''

        // const classNameMatch = xwininfoDetails.match(/Class: (.*)/)
        // className = classNameMatch ? classNameMatch[1] : ''

        const pidMatch = xwininfoDetails.match(/Process id: (\d+)/)
        pid = pidMatch ? pidMatch[1] : ''

        executable = pid ? execSync(`ps -p ${pid} -o comm=`).toString().trim() : ''
      }
    }
    return { title, executable, 
      // className 
    }
  } catch (error) {
    const errorMessage = 'Error getting active window info: ' + error
    console.error(errorMessage)
    return undefined
  }
}

export const Tracker = {
  resetForOs,
  prepForOs,
  trackActiveWindow
}
