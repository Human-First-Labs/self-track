import os from 'os'
import { ActiveWindowInfo, ActivityPeriod, SupportedOS, SupportedOSList } from './entities'
import { Tracker } from './window-tracking'
import { BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { DataWriter } from './data-consolidation'
import { InteractionTracker } from './interaction-tracking'
import { MainToRendererChannel } from './events'
import { PermissionChecks } from './permission-checker'
import { DataProcessor } from './ruling'
import fs from 'fs'

let windowInterval: string | number | NodeJS.Timeout | undefined
let previousPoint: ActiveWindowInfo | undefined = undefined
let currentActivity: ActivityPeriod | undefined = undefined

export const startSession = async (args: {
  mainWindow: BrowserWindow
  permissionChecks: PermissionChecks
}): Promise<void> => {
  const { mainWindow, permissionChecks } = args

  const prep = Tracker.prepForOs()
  if (permissionChecks.inputPermission) {
    await InteractionTracker.start()
  }

  windowInterval = setInterval(async () => {
    try {
      const tracking = Tracker.trackActiveWindow({
        prep,
        permissionChecks
      })

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

        const previousActivity = currentActivity

        currentActivity = {
          id,
          start: previousActivity ? previousActivity.end : DateTime.now().toMillis(),
          end: DateTime.now().toMillis(),
          details: {
            interactive: tracking.interactive,
            title: tracking.title,
            executable: tracking.executable
          }
        }
        await DataWriter.addLine(currentActivity)
      } else {
        if (!currentActivity) {
          throw new Error('No current activity')
        }

        currentActivity.end = DateTime.now().toMillis()
        DataWriter.updateLastLine(currentActivity)
      }

      const event: MainToRendererChannel = 'send-window-info'
      mainWindow.webContents.send(event, currentActivity)
    } catch (error) {
      console.error('Error in tracking interval:', error)
      const event2: MainToRendererChannel = 'tracking-error'
      // Optionally, you can send an error message to the renderer process
      mainWindow.webContents.send(event2, 'An error occurred while tracking the active window.')
    }
  }, 1000)
}

export const endSession = async (): Promise<void> => {
  clearInterval(windowInterval)
  Tracker.resetForOs()
  InteractionTracker.end()
  const currentFile = DataWriter.closeCSV()

  if (currentFile) {
    const data = await DataWriter.loadCSV(currentFile)

    const processedData = DataProcessor.processRawData(data)

    fs.writeFileSync('test.txt', JSON.stringify(processedData), 'utf-8')
  }
}

export const detectOS = (): SupportedOS => {
  const platform = os.platform()

  if (!SupportedOSList.includes(platform as SupportedOS)) {
    throw new Error(`Unsupported OS: ${platform}`)
  }

  return platform as SupportedOS
}
