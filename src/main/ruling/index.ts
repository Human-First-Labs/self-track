import { ActivityPeriod, FinalReport } from '../entities'

const processRawData = (rawData: ActivityPeriod[]): FinalReport => {
  const finalReport: FinalReport = {
    activities: [],
    duration: 0,
    end: 0,
    start: 0
  }

  rawData.forEach((activity) => {
    finalReport.totalTime += activity.duration
    finalReport.details.push({
      ...activity,
      projectName: activity.projectName || '',
      details: activity.details.title || ''
    })
  })

  return finalReport
}

export const DataProcessor = {
  processRawData
}
