import { DateTime } from 'luxon'
import fs from 'fs'
import { ActivityPeriod } from './entities'
import { app } from 'electron'
import csvParser from 'csv-parser'

const securePath = app.getPath('userData')
const basePath = `${securePath}/exports/`

let currentFile = ``

const csvHeader = 'id,title,className,executable,interactive,start,end\n'

const convertActivityToCSV = (data: ActivityPeriod): string => {
  let dataString = ''

  dataString += `${data.id},${data.details.title},${data.details.className},${data.details.executable},${data.details.interactive},${DateTime.fromMillis(data.start).toISO()},${DateTime.fromMillis(data.end).toISO()}\n`

  return dataString
}

const addLine = (data: ActivityPeriod): void => {
  let dataString = ''
  if (!currentFile) {
    try {
      fs.accessSync(basePath, fs.constants.F_OK)
    } catch (e) {
      console.error(e)
      fs.mkdirSync(basePath, { recursive: true })
    }

    const timestamp = DateTime.now().toMillis()

    currentFile = `${basePath}data-${timestamp}.csv`

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
          className: currentData.className,
          title: currentData.title,
          executable: currentData.executable,
          interactive: currentData.interactive === 'true' ? true : false
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

const closeCSV = (): void => {
  currentFile = ''
}

export const DataWriter = {
  addLine,
  updateLastLine,
  closeCSV
}
