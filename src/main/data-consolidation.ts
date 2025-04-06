import { DateTime } from 'luxon'
import fs from 'fs'
import { ActivityPeriod } from './entities'
import { app } from 'electron'
import csvParser from 'csv-parser'

const securePath = app.getPath('userData')

export const basePath = `${securePath}/exports`
export const rawPath = basePath + '/raw'

let currentFile = ``

const csvHeader = 'id,title,executable,interactive,start,end\n'

const createDirectories = (): void => {
  //raw path
  try {
    fs.accessSync(rawPath, fs.constants.F_OK)
  } catch (e) {
    console.error(e)
    fs.mkdirSync(rawPath, { recursive: true })
  }
}

const convertActivityToCSV = (data: ActivityPeriod): string => {
  let dataString = ''

  dataString += `${data.id},${data.details.title},${data.details.executable},${data.details.interactive},${DateTime.fromMillis(data.start).toISO()},${DateTime.fromMillis(data.end).toISO()}\n`

  return dataString
}

const addLine = async (data: ActivityPeriod): Promise<void> => {
  let dataString = ''
  if (!currentFile) {
    const timestamp = DateTime.now().toFormat('yyyy-MM-dd_HH-mm-ss')

    currentFile = `${rawPath}/${timestamp}.csv`

    dataString += csvHeader
  }

  dataString += convertActivityToCSV(data)

  fs.appendFileSync(currentFile, dataString, 'utf-8')
}

const updateLastLine = (data: ActivityPeriod): void => {
  if (!currentFile) {
    throw new Error('No file to update')
  }

  const parsed: ActivityPeriod[] = []

  fs.createReadStream(currentFile)
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
      const found = parsed.findIndex((item) => item.id === data.id)

      if (found !== -1) {
        parsed[found] = data
      } else {
        parsed.push(data)
      }

      dataString += csvHeader
      for (let i = 0; i < parsed.length; i++) {
        const item = parsed[i]

        dataString += convertActivityToCSV(item)
      }

      fs.writeFileSync(currentFile, dataString, 'utf-8')
    })
}

const closeCSV = (): string => {
  const currentFileCopy = currentFile
  currentFile = ''
  return currentFileCopy
}

const loadCSV = (filePath: string): Promise<ActivityPeriod[]> => {
  const parsed: ActivityPeriod[] = []

  return new Promise((resolve, reject) => {
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
        resolve(parsed)
      })
      .on('error', (error) => {
        console.error('Error reading CSV file:', error)
        reject(error)
      })
  })
}

export const DataWriter = {
  createDirectories,
  addLine,
  updateLastLine,
  closeCSV,
  loadCSV
}
