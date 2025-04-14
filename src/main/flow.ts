import os from 'os'
import {
  ActiveWindowInfo,
  ActivityPeriod,
  SupportedOS,
  SupportedOSList
} from './self-track/entities'
import { Tracker } from './self-track/window-tracking'
import { BrowserWindow } from 'electron'
import { v4 as uuidv4 } from 'uuid'
import { DateTime } from 'luxon'
import { InteractionTracker } from './self-track/interaction-tracking'
import { MainToRendererChannel } from './self-track/events'
import { PermissionChecks } from './self-track/permission-checker'
import { DataProcessor } from './self-track/ruling'
import { CurrentFile, DataWriter } from './self-track/data-consolidation'
import { rawPath, reportPath } from '.'

// Variables to manage the tracking session
let windowInterval: string | number | NodeJS.Timeout | undefined // Interval for tracking active windows
let previousPoint: ActiveWindowInfo | undefined = undefined // Stores the last tracked window info
let currentActivity: ActivityPeriod | undefined = undefined // Stores the current activity period

// Variable to store the current file being written to
let currentFile: CurrentFile | undefined

// Function to start a tracking session
export const startSession = async (args: {
  mainWindow: BrowserWindow // Reference to the main Electron window
  permissionChecks: PermissionChecks // Permissions for interactivity tracking
}): Promise<void> => {
  const { mainWindow, permissionChecks } = args

  // Prepare OS-specific configurations for tracking
  const prep = Tracker.prepForOs()

  // Start interaction tracking if input permissions are granted
  if (permissionChecks.inputPermission) {
    await InteractionTracker.start()
  }

  // Set an interval to track the active window every second
  windowInterval = setInterval(async () => {
    try {
      // Track the currently active window
      const tracking = Tracker.trackActiveWindow({
        prep,
        permissionChecks
      })

      let newActivity = false // Flag to indicate if a new activity is detected

      // Check if this is the first tracking point or if the active window has changed
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
        // Generate a unique ID for the new activity
        const id = uuidv4()

        // Store the previous activity
        const previousActivity = currentActivity

        // Create a new activity period
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

        if (!currentFile) {
          DataWriter.createFile({
            rawPath
          })
        }

        // Add the new activity to the data writer
        DataWriter.addLine({
          data: currentActivity,
          currentFile
        })
      } else {
        // Update the end time of the current activity
        if (!currentActivity) {
          throw new Error('No current activity')
        }

        currentActivity.end = DateTime.now().toMillis()
        await DataWriter.updateLastLine({
          currentFile,
          data: currentActivity
        })
      }

      // Send the current activity to the renderer process
      const event: MainToRendererChannel = 'send-window-info'
      mainWindow.webContents.send(event, currentActivity)
    } catch (error) {
      console.error('Error in tracking interval:', error)

      // Send an error message to the renderer process
      const event2: MainToRendererChannel = 'tracking-error'
      mainWindow.webContents.send(event2, 'An error occurred while tracking the active window.')
    }
  }, 1000) // Interval set to 1 second
}

// Function to end the tracking session
export const endSession = async (): Promise<void> => {
  // Clear the tracking interval
  clearInterval(windowInterval)

  // Reset OS-specific configurations
  Tracker.resetForOs()

  // End interaction tracking
  InteractionTracker.end()

  // Close the current CSV file and get its path
  // const currentFile = DataWriter.closeCSV()

  if (currentFile) {
    // Load the data from the CSV file
    const data = await DataWriter.loadCSV(currentFile.fullPath)

    // Process the raw data
    const processedData = DataProcessor.processRawData(data)

    DataProcessor.generateFinalExcelReport({
      data: processedData,
      rawName: currentFile.name,
      reportPath
    })

    currentFile = undefined // Reset the current file variable
  }
}

// Function to detect the operating system
export const detectOS = (): SupportedOS => {
  const platform = os.platform() // Get the current platform

  // Check if the platform is supported
  if (!SupportedOSList.includes(platform as SupportedOS)) {
    throw new Error(`Unsupported OS: ${platform}`)
  }

  return platform as SupportedOS // Return the platform as a supported OS
}
