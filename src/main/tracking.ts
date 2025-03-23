import { execSync } from 'child_process'
import os from 'os'

export interface ActiveWindowInfo {
  title: string
  executable: string
  className: string
}

export const trackActiveWindow = async (): Promise<ActiveWindowInfo | undefined> => {
  const platform = os.platform()
  if (platform === 'win32') {
    return await trackActiveWindow_Windows()
  }
  if (platform === 'darwin') {
    return trackActiveWindow_Mac()
  }
  if (platform === 'linux') {
    return trackActiveWindow_Linux()
  } else {
    throw new Error('Unsupported OS')
  }
}

const trackActiveWindow_Windows = async (): Promise<ActiveWindowInfo | undefined> => {
  try {
    const winax = await import('winax')
    const shell = new winax.Object('Shell.Application')
    const activeWindow = shell.Windows().Item(shell.Windows().Count - 1)
    const className =
      activeWindow.Document?.Application?.Name ||
      activeWindow.Document?.Application.Path ||
      'Unknown'
    if (activeWindow) {
      console.log(activeWindow)

      return {
        title: activeWindow.LocationName,
        executable: activeWindow.FullName,
        className
      }
    }
  } catch (error) {
    console.error('Error getting active window info using winax:', error)
    return null
  }
  return
}

const trackActiveWindow_Mac = (): undefined => {
  throw new Error('OS still under development')
  // return
  //TODO to be implemented
}

const trackActiveWindow_Linux = (): ActiveWindowInfo | undefined => {
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
    console.error('Error getting active window info:', error)
    return null
  }
}
