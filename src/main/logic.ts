import os from 'os'
import {
  ActiveWindowInfo,
  ActivityPeriod,
  FinalReport,
  SupportedOS,
  SupportedOSList
} from './entities'
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

//TODO to remove later
const test: FinalReport = {
  activities: [
    {
      program: 'Unknown Software',
      executable:
        'C:\\Users\\Maurovic Cachia\\Repo\\self-track\\node_modules\\electron\\dist\\electron.exe',
      projectPeriods: [
        {
          project: '',
          periods: [
            {
              startDate: '2025-04-06 12:20:47',
              endDate: '2025-04-06 12:20:48',
              duration: '0 hours, 0 minutes, 1 second',
              details: 'Self Tracker',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:20:50',
              endDate: '2025-04-06 12:20:51',
              duration: '0 hours, 0 minutes, 1 second',
              details: 'Self Tracker',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:31',
              endDate: '2025-04-06 12:21:33',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: 'Self Tracker',
              interactive: 'active'
            }
          ],
          totalDuration: '0 hours, 0 minutes, 4 seconds',
          totalActiveDuration: '0 hours, 0 minutes, 4 seconds'
        },

        {
          project: '2',
          periods: [
            {
              startDate: '2025-04-06 12:20:47',
              endDate: '2025-04-06 12:20:48',
              duration: '0 hours, 0 minutes, 1 second',
              details: 'Self Tracker',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:20:50',
              endDate: '2025-04-06 12:20:51',
              duration: '0 hours, 0 minutes, 1 second',
              details: 'Self Tracker',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:31',
              endDate: '2025-04-06 12:21:33',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: 'Self Tracker',
              interactive: 'active'
            }
          ],
          totalDuration: '0 hours, 0 minutes, 4 seconds',
          totalActiveDuration: '0 hours, 0 minutes, 4 seconds'
        }
      ],
      totalDuration: '0 hours, 0 minutes, 8 seconds',
      totalActiveDuration: '0 hours, 0 minutes, 8 seconds'
    },
    {
      program: 'Visual Studio Code',
      executable:
        'C:\\Users\\Maurovic Cachia\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe',
      projectPeriods: [
        {
          project: 'self-track',
          periods: [
            {
              startDate: '2025-04-06 12:20:48',
              endDate: '2025-04-06 12:20:50',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: 'data-consolidation.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:20:51',
              endDate: '2025-04-06 12:20:53',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: 'data-consolidation.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:20:53',
              endDate: '2025-04-06 12:21:03',
              duration: '0 hours, 0 minutes, 10 seconds',
              details: 'index.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:04',
              endDate: '2025-04-06 12:21:09',
              duration: '0 hours, 0 minutes, 4 seconds',
              details: 'index.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:09',
              endDate: '2025-04-06 12:21:26',
              duration: '0 hours, 0 minutes, 17 seconds',
              details: 'entities.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:33',
              endDate: '2025-04-06 12:21:37',
              duration: '0 hours, 0 minutes, 4 seconds',
              details: 'entities.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:37',
              endDate: '2025-04-06 12:21:44',
              duration: '0 hours, 0 minutes, 7 seconds',
              details: 'events.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:44',
              endDate: '2025-04-06 12:21:56',
              duration: '0 hours, 0 minutes, 12 seconds',
              details: 'index.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:56',
              endDate: '2025-04-06 12:22:11',
              duration: '0 hours, 0 minutes, 15 seconds',
              details: 'interaction-tracking.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:22:11',
              endDate: '2025-04-06 12:22:21',
              duration: '0 hours, 0 minutes, 10 seconds',
              details: 'logic.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:22:21',
              endDate: '2025-04-06 12:22:39',
              duration: '0 hours, 0 minutes, 18 seconds',
              details: 'permission-checker.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:22:39',
              endDate: '2025-04-06 12:22:51',
              duration: '0 hours, 0 minutes, 12 seconds',
              details: 'window-tracking.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:22:51',
              endDate: '2025-04-06 12:23:01',
              duration: '0 hours, 0 minutes, 9 seconds',
              details: 'chrome.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:23:03',
              endDate: '2025-04-06 12:23:06',
              duration: '0 hours, 0 minutes, 3 seconds',
              details: 'chrome.ts',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:23:06',
              endDate: '2025-04-06 12:23:08',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: 'default.ts',
              interactive: 'active'
            }
          ],
          totalDuration: '0 hours, 2 minutes, 8 seconds',
          totalActiveDuration: '0 hours, 2 minutes, 8 seconds'
        }
      ],
      totalDuration: '0 hours, 2 minutes, 8 seconds',
      totalActiveDuration: '0 hours, 2 minutes, 8 seconds'
    },
    {
      program: 'Google Chrome',
      executable: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      projectPeriods: [
        {
          project: '',
          periods: [
            {
              startDate: '2025-04-06 12:21:03',
              endDate: '2025-04-06 12:21:04',
              duration: '0 hours, 0 minutes, 1 second',
              details: 'Hardly Working: Gale Beggy - YouTube',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:23:01',
              endDate: '2025-04-06 12:23:03',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: "Hardly Working: Ricky's Diary - YouTube",
              interactive: 'active'
            }
          ],
          totalDuration: '0 hours, 0 minutes, 3 seconds',
          totalActiveDuration: '0 hours, 0 minutes, 3 seconds'
        }
      ],
      totalDuration: '0 hours, 0 minutes, 3 seconds',
      totalActiveDuration: '0 hours, 0 minutes, 3 seconds'
    },
    {
      program: 'Windows Explorer',
      executable: 'C:\\Windows\\explorer.exe',
      projectPeriods: [
        {
          project: '',
          periods: [
            {
              startDate: '2025-04-06 12:21:26',
              endDate: '2025-04-06 12:21:29',
              duration: '0 hours, 0 minutes, 3 seconds',
              details: 'Home - File Explorer',
              interactive: 'active'
            },
            {
              startDate: '2025-04-06 12:21:29',
              endDate: '2025-04-06 12:21:31',
              duration: '0 hours, 0 minutes, 2 seconds',
              details: 'exports - File Explorer',
              interactive: 'active'
            }
          ],
          totalDuration: '0 hours, 0 minutes, 5 seconds',
          totalActiveDuration: '0 hours, 0 minutes, 5 seconds'
        }
      ],
      totalDuration: '0 hours, 0 minutes, 5 seconds',
      totalActiveDuration: '0 hours, 0 minutes, 5 seconds'
    }
  ],
  totalDuration: '0 hours, 2 minutes, 20 seconds',
  endDate: '2025-04-06 12:23:08',
  startDate: '2025-04-06 12:20:47'
}
DataProcessor.generateFinalExcelReport(test, 'test.csv')

// Variables to manage the tracking session
let windowInterval: string | number | NodeJS.Timeout | undefined // Interval for tracking active windows
let previousPoint: ActiveWindowInfo | undefined = undefined // Stores the last tracked window info
let currentActivity: ActivityPeriod | undefined = undefined // Stores the current activity period

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

        // Add the new activity to the data writer
        await DataWriter.addLine(currentActivity)
      } else {
        // Update the end time of the current activity
        if (!currentActivity) {
          throw new Error('No current activity')
        }

        currentActivity.end = DateTime.now().toMillis()
        DataWriter.updateLastLine(currentActivity)
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
  const currentFile = DataWriter.closeCSV()

  if (currentFile) {
    // Load the data from the CSV file
    const data = await DataWriter.loadCSV(currentFile.fullPath)

    // Process the raw data
    const processedData = DataProcessor.processRawData(data)

    DataProcessor.generateFinalExcelReport(processedData, currentFile.name)

    // Write the processed data to a test file
    fs.writeFileSync('test.txt', JSON.stringify(processedData), 'utf-8')
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
