import os from 'os'
import { ActiveWindowInfo, ActivityPeriod, MainToRendererChannel } from './entities'
import { Tracker } from './window-tracking'
import { BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { DataWriter } from './data-consolidation'

let windowInterval: string | number | NodeJS.Timeout | undefined
let previousPoint: ActiveWindowInfo | undefined = undefined
let currentActivity: ActivityPeriod | undefined = undefined

export const startTracking = (mainWindow: BrowserWindow): void => {
  const args = Tracker.prepForOs()

  windowInterval = setInterval(() => {
    const tracking = Tracker.trackActiveWindow(args)

    const event: MainToRendererChannel = 'send-window-info'

    let newActivity = false

    if (!previousPoint) {
      previousPoint = tracking
      newActivity = true
    } else {
      if (previousPoint.hash !== tracking.hash) {
        previousPoint = tracking
        newActivity = true
      }
    }

    if (newActivity) {
      const id = uuidv4()

      currentActivity = {
        id,
        start: DateTime.now().toMillis(),
        end: DateTime.now().toMillis(),
        details: {
          className: tracking.className,
          interactive: tracking.interactive,
          title: tracking.title,
          executable: tracking.executable
        }
      }
      DataWriter.addLine(currentActivity)
    } else {
      if (!currentActivity) {
        throw new Error('No current activity')
      }

      currentActivity.end = DateTime.now().toMillis()
      DataWriter.updateLastLine(currentActivity)
    }

    mainWindow.webContents.send(event, currentActivity)
  }, 1000)
}

export const endTracking = (): void => {
  clearInterval(windowInterval)
  Tracker.resetForOs()
}

export const detectOS = (): string => {
  const platform = os.platform()

  return platform
}
