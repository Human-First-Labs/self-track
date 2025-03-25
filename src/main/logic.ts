import os from 'os'
import { MainToRendererChannel } from './entities'
import { prepForOs, resetForOs, trackActiveWindow } from './tracking'

let interval: string | number | NodeJS.Timeout | undefined

export const startTracking = (mainWindow: any) => {
  const args = prepForOs()

  interval = setInterval(() => {
    const tracking = trackActiveWindow(args)
    const event: MainToRendererChannel = 'send-window-info'
    mainWindow.webContents.send(event, tracking)
  }, 1000)
}

export const endTracking = () => {
  clearInterval(interval)
  resetForOs()
}

export const detectOS = () => {
  const platform = os.platform()

  return platform
}
