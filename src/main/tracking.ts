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
    const winax = await import('winax')
    const shell = new winax.Object('Shell.Application')
    const activeWindow = shell.Windows().Item(shell.Windows().Count - 1)
    const className =
      activeWindow.Document?.Application?.Name ||
      activeWindow.Document?.Application.Path ||
      'Unknown'
    if (activeWindow) {
      return {
        title: activeWindow.LocationName,
        executable: activeWindow.FullName,
        className,
        allData: JSON.stringify(activeWindow)
      }
    }
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
