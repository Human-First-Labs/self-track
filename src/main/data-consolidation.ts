import { DateTime } from 'luxon'
import fs from 'fs'
import { ActivityPeriod } from './entities'
import csvParser from 'csv-parser'
import { app } from 'electron'

const securePath = app.getPath('userData')
const basePath = `${securePath}/exports/`

let currentFile = ``

const csvHeader = 'id,title,className,executable,start,end\n'

const writeAddData = (data: ActivityPeriod): void => {
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

    dataString += `${data.id},${data.title},${data.className},${data.executable},${DateTime.fromMillis(data.start).toISO()},${DateTime.fromMillis(data.end).toISO()}\n`

    console.log(dataString)

    fs.writeFileSync(currentFile, dataString, 'utf-8')
  } else {
    const parsed: ActivityPeriod[] = []

    fs.createReadStream(currentFile)
      .pipe(csvParser())
      .on('data', (currentData) =>
        parsed.push({
          ...currentData,
          start: DateTime.fromISO(currentData.start).toMillis(),
          end: DateTime.fromISO(currentData.end).toMillis()
        })
      )
      .on('end', () => {
        const found = parsed.findIndex((item) => item.id === data.id)

        if (found !== -1) {
          parsed[found] = data
        } else {
          parsed.push(data)
        }

        dataString += csvHeader
        for (let i = 0; i < parsed.length; i++) {
          const item = parsed[i]

          dataString += `${item.id},${item.title},${item.className},${item.executable},${DateTime.fromMillis(item.start).toISO()},${DateTime.fromMillis(item.end).toISO()}\n`
        }

        fs.writeFileSync(currentFile, dataString, 'utf-8')
      })
  }
}

const closeCSV = (): void => {
  currentFile = ''
}

export const DataWriter = {
  writeAddData,
  closeCSV
}
