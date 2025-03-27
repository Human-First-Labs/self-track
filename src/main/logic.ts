import os from 'os'
import { MainToRendererChannel } from './entities'
import { Tracker } from './tracking'
import { BrowserWindow } from 'electron'

let interval: string | number | NodeJS.Timeout | undefined

export const startTracking = (mainWindow: BrowserWindow): void => {
  const args = Tracker.prepForOs()

  interval = setInterval(() => {
    const tracking = Tracker.trackActiveWindow(args)
    const event: MainToRendererChannel = 'send-window-info'
    mainWindow.webContents.send(event, tracking)
  }, 1000)
}

export const endTracking = (): void => {
  clearInterval(interval)
  Tracker.resetForOs()
}

export const detectOS = (): string => {
  const platform = os.platform()

  return platform
}
