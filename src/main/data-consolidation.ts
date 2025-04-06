import { DateTime } from 'luxon' // Library for date and time manipulation
import fs from 'fs' // File system module for file operations
import { ActivityPeriod } from './entities' // Type definition for activity periods
import { app } from 'electron' // Electron module to access app-specific paths
import csvParser from 'csv-parser' // Library to parse CSV files

// Get the secure path for storing user data
const securePath = app.getPath('userData')

// Define base paths for storing exported data
export const basePath = `${securePath}/exports`
export const rawPath = basePath + '/raw'
export const reportPath = basePath + '/reports'

interface CurrentPath {
  fullPath: string
  name: string
}

// Variable to store the current file being written to
let currentFile: CurrentPath | undefined

// Define the CSV header for activity data
const csvHeader = 'id,title,executable,interactive,start,end\n'

// Function to create necessary directories for storing data
const createDirectories = (): void => {
  try {
    // Check if the raw path exists
    fs.accessSync(rawPath, fs.constants.F_OK)
  } catch (e) {
    // If it doesn't exist, create it recursively
    console.error(e)
    fs.mkdirSync(rawPath, { recursive: true })
  }

  try {
    // Check if the report path exists
    fs.accessSync(reportPath, fs.constants.F_OK)
  } catch (e) {
    // If it doesn't exist, create it recursively
    console.error(e)
    fs.mkdirSync(reportPath, { recursive: true })
  }
}

// Function to convert an activity period into a CSV-formatted string
const convertActivityToCSV = (data: ActivityPeriod): string => {
  let dataString = ''

  // Format the activity data into a CSV row
  dataString += `${data.id},${data.details.title},${data.details.executable},${data.details.interactive},${DateTime.fromMillis(data.start).toISO()},${DateTime.fromMillis(data.end).toISO()}\n`

  return dataString
}

// Function to add a new activity period to the CSV file
const addLine = async (data: ActivityPeriod): Promise<void> => {
  let dataString = ''

  // If no file is currently open, create a new one with a timestamp
  if (!currentFile) {
    const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss')
    currentFile = {
      fullPath: `${rawPath}/${timestamp}.csv`,
      name: `${timestamp}.csv`
    }
    dataString += csvHeader // Add the CSV header to the new file
  }

  // Convert the activity data to CSV format and append it to the file
  dataString += convertActivityToCSV(data)
  fs.appendFileSync(currentFile.fullPath, dataString, 'utf-8')
}

// Function to update the last line of the CSV file with new activity data
const updateLastLine = (data: ActivityPeriod): void => {
  if (!currentFile) {
    throw new Error('No file to update') // Throw an error if no file is open
  }

  const parsed: ActivityPeriod[] = [] // Array to store parsed activity data

  // Read the current file and parse its contents
  fs.createReadStream(currentFile.fullPath)
    .pipe(csvParser())
    .on('data', (currentData) =>
      parsed.push({
        id: currentData.id,
        details: {
          title: currentData.title,
          executable: currentData.executable,
          interactive: currentData.interactive
        },
        start: DateTime.fromISO(currentData.start).toMillis(),
        end: DateTime.fromISO(currentData.end).toMillis()
      })
    )
    .on('end', () => {
      let dataString = ''
      const found = parsed.findIndex((item) => item.id === data.id) // Find the activity to update

      if (found !== -1) {
        // If the activity exists, update it
        parsed[found] = data
      } else {
        // Otherwise, add it as a new activity
        parsed.push(data)
      }

      // Rebuild the CSV file with the updated data
      dataString += csvHeader
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]
        dataString += convertActivityToCSV(item)
      }

      if (!currentFile) {
        throw new Error('No file to update') // Throw an error if no file is open
      }

      // Write the updated data back to the file
      fs.writeFileSync(currentFile.fullPath, dataString, 'utf-8')
    })
}

// Function to close the current CSV file and return its path
const closeCSV = (): CurrentPath => {
  if (!currentFile) {
    throw new Error('No file to close') // Throw an error if no file is open
  }

  const currentFileCopy = currentFile // Store the current file path
  currentFile = undefined // Reset the current file variable
  return currentFileCopy // Return the file path
}

// Function to load activity data from a CSV file
const loadCSV = (filePath: string): Promise<ActivityPeriod[]> => {
  const parsed: ActivityPeriod[] = [] // Array to store parsed activity data

  return new Promise((resolve, reject) => {
    // Read the CSV file and parse its contents
    fs.createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (currentData) =>
        parsed.push({
          id: currentData.id,
          details: {
            title: currentData.title,
            executable: currentData.executable,
            interactive: currentData.interactive
          },
          start: DateTime.fromISO(currentData.start).toMillis(),
          end: DateTime.fromISO(currentData.end).toMillis()
        })
      )
      .on('end', () => {
        resolve(parsed) // Resolve the promise with the parsed data
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error)
        reject(error) // Reject the promise if an error occurs
      })
  })
}

// Export the DataWriter object with the defined functions
export const DataWriter = {
  createDirectories, // Create necessary directories
  addLine, // Add a new activity to the CSV file
  updateLastLine, // Update the last activity in the CSV file
  closeCSV, // Close the current CSV file
  loadCSV // Load activity data from a CSV file
}
