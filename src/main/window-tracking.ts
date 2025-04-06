import { execSync } from 'child_process'
import { ActiveWindowInfo, ActiveWindowInfoOnly } from './entities'
import os from 'os'
import koffi, { inout, KoffiFunction, opaque, out, pointer } from 'koffi'
import { InteractionTracker } from './interaction-tracking'
import { createHash } from 'crypto'
import { PermissionChecks } from './permission-checker'

// Interface defining the structure for Windows-specific preparation work
interface WindowsPrepWork {
  GetForegroundWindow: KoffiFunction
  GetWindowThreadProcessId: KoffiFunction
  GetWindowText: KoffiFunction
  OpenProcess: KoffiFunction
  QueryFullProcessImageName: KoffiFunction
  CloseHandle: KoffiFunction
}

// Function to clean up window titles by removing unnecessary characters
const titleCleanUp = (title: string): string => {
  // Remove numbers in brackets (e.g., "[1]", "(2)")
  let cleanedText = title.replace(/[[(]\d+[\])]/g, '')
  // Remove special symbols like "●", "*", "•", etc.
  cleanedText = cleanedText.replace(/[●•*]/g, '')
  // Remove extra spaces
  return cleanedText.replace(/\s+/g, ' ').trim()
}

// Function to reset OS-specific configurations
const resetForOs = (): void => {
  const platform = os.platform()

  if (platform === 'win32') {
    resetForOs_Windows()
  }
}

// Function to reset Windows-specific configurations
const resetForOs_Windows = (): void => {
  koffi.reset()
}

// Function to prepare OS-specific configurations
const prepForOs = (): WindowsPrepWork | undefined => {
  const platform = os.platform()

  let setup: WindowsPrepWork | undefined = undefined

  if (platform === 'win32') {
    setup = prepForOs_Windows()
  }

  return setup
}

// Function to prepare Windows-specific configurations
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

  // Define Windows API functions
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

  const OpenProcess = kernel32Function('OpenProcess', cHANDLE, [cDWORD, cBOOL, cDWORD])

  const QueryFullProcessImageName = kernel32Function('QueryFullProcessImageNameW', cBOOL, [
    cHANDLE,
    cDWORD,
    out(cLPWSTR),
    inout(cLPDWORD)
  ])

  const CloseHandle = kernel32Function('CloseHandle', cBOOL, [cHANDLE])

  // Return the prepared Windows API functions
  return {
    GetForegroundWindow,
    GetWindowThreadProcessId,
    GetWindowText,
    OpenProcess,
    QueryFullProcessImageName,
    CloseHandle
  }
}

// Function to track the active window based on the OS
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

  // Determine interaction state based on permissions
  const interaction = permissionChecks.inputPermission
    ? InteractionTracker.checkState()
      ? 'active'
      : 'inactive'
    : 'unknown'

  // Clean up the title and add interaction state
  const info: ActiveWindowInfoOnly = {
    ...activeWindowInfo,
    title: titleCleanUp(activeWindowInfo.title),
    interactive: interaction
  }

  // Generate a hash for the active window info
  const hash = createHash('md5').update(JSON.stringify(info)).digest('hex')

  return {
    hash,
    ...info
  }
}

// Function to track the active window on Windows
const trackActiveWindow_Windows = (
  args: WindowsPrepWork
): Omit<ActiveWindowInfoOnly, 'interactive'> | undefined => {
  const {
    GetForegroundWindow,
    GetWindowThreadProcessId,
    GetWindowText,
    OpenProcess,
    QueryFullProcessImageName,
    CloseHandle
  } = args

  const textDecoder = new TextDecoder('utf-16')

  try {
    // Constants for process access
    const PROCESS_QUERY_INFORMATION = 0x0400
    const PROCESS_VM_READ = 0x0010

    // Get the handle of the foreground window
    const hwnd = GetForegroundWindow()

    if (!hwnd) {
      console.warn('No foreground window found')
      return undefined
    }

    // Get the window title
    const out = new Uint16Array(512)
    const len = GetWindowText(hwnd, out, 512)
    const title = textDecoder.decode(out).slice(0, len)

    // Get the process ID of the window
    const out2 = [0] as [number]
    GetWindowThreadProcessId(hwnd, out2)
    const pid = out2[0]

    // Open the process to retrieve additional information
    const processHandle = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, 0, pid)
    if (!processHandle) {
      throw new Error(`Failed to open process for PID: ${pid}`)
    }

    // Get the full process image name (executable path)
    const exeName = new Uint16Array(256)
    const dwSize = [exeName.length] as [number]
    const executable =
      QueryFullProcessImageName(processHandle, 0, exeName, dwSize) === 0
        ? undefined
        : textDecoder.decode(exeName).slice(0, dwSize[0])

    if (!executable) {
      throw new Error(`Failed to get executable name for PID: ${pid}`)
    }

    // Close the process handle
    CloseHandle(processHandle)

    return {
      title,
      executable
    }
  } catch (error) {
    console.error(`Error getting active window info: ${error}`)
    return undefined
  }
}

// Function to track the active window on macOS (not implemented)
const trackActiveWindow_Mac = (): undefined => {
  throw new Error('OS still under development')
  // TODO: To be implemented
}

// Function to track the active window on Linux
const trackActiveWindow_Linux = (): Omit<ActiveWindowInfoOnly, 'interactive'> | undefined => {
  try {
    // Attempt to get the active window ID using xprop
    let windowId = execSync("xprop -root _NET_ACTIVE_WINDOW | awk '{print $5}'").toString().trim()
    let title = ''
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

      pid = execSync(`xprop -id ${windowId} _NET_WM_PID | awk '{print $3}'`).toString().trim()
      executable = execSync(`ps -p ${pid} -o comm=`).toString().trim()
    }

    if (!title || !pid) {
      // Fallback to xwininfo if xprop fails
      const xwininfoOutput = execSync('xwininfo -root -tree').toString()
      const match = xwininfoOutput.match(/0x[0-9a-fA-F]+/)

      if (match) {
        windowId = match[0]

        const xwininfoDetails = execSync(`xwininfo -id ${windowId}`).toString()

        const titleMatch = xwininfoDetails.match(/xwininfo: Window id: .* "(.*)"/)
        title = titleMatch ? titleMatch[1] : ''

        const pidMatch = xwininfoDetails.match(/Process id: (\d+)/)
        pid = pidMatch ? pidMatch[1] : ''

        executable = pid ? execSync(`ps -p ${pid} -o comm=`).toString().trim() : ''
      }
    }

    return {
      title,
      executable
    }
  } catch (error) {
    console.error('Error getting active window info: ' + error)
    return undefined
  }
}

// Export the Tracker object with the defined functions
export const Tracker = {
  resetForOs,
  prepForOs,
  trackActiveWindow
}