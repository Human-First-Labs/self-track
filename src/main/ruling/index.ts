import { DateTime, Duration } from 'luxon'
import { ActivityPeriod, FinalReport } from '../entities'
import { ruleSets } from './rule-sets'
import os from 'os'

const processRawData = (rawData: ActivityPeriod[]): FinalReport => {
  const finalReport: FinalReport = {
    activities: [],
    totalDuration: '',
    endDate: '',
    startDate: ''
  }

  const firstPeriod = rawData[0]
  const lastPeriod = rawData[rawData.length - 1]

  finalReport.startDate = DateTime.fromMillis(firstPeriod.start).toFormat('yyyy-LL-dd HH:mm:ss')
  finalReport.endDate = DateTime.fromMillis(lastPeriod.end).toFormat('yyyy-LL-dd HH:mm:ss')
  finalReport.totalDuration = DateTime.fromMillis(lastPeriod.end)
    .diff(DateTime.fromMillis(firstPeriod.start))
    .shiftTo('hours', 'minutes', 'seconds')
    .toHuman({
      maximumFractionDigits: 0,
      roundingIncrement: 1
    })

  const interactivePeriods = rawData.filter((activity) => {
    return activity.details.interactive === 'active'
  })

  if (interactivePeriods.length > 0) {
    const interactiveDuration = Duration.fromMillis(0)
    interactivePeriods.map((activity) => {
      interactiveDuration.plus(
        DateTime.fromMillis(activity.end).diff(DateTime.fromMillis(activity.start))
      )
    })
    finalReport.totalInteractiveDuration = interactiveDuration
      .shiftTo('hours', 'minutes', 'seconds')
      .toHuman({
        maximumFractionDigits: 0,
        roundingIncrement: 1
      })
  }

  const inactivePeriods = rawData.filter((activity) => {
    return activity.details.interactive === 'inactive'
  })

  if (inactivePeriods.length > 0) {
    const inactiveDuration = Duration.fromMillis(0)
    inactivePeriods.map((activity) => {
      inactiveDuration.plus(
        DateTime.fromMillis(activity.end).diff(DateTime.fromMillis(activity.start))
      )
    })
    finalReport.totalInactiveDuration = inactiveDuration
      .shiftTo('hours', 'minutes', 'seconds')
      .toHuman({
        maximumFractionDigits: 0,
        roundingIncrement: 1
      })
  }

  rawData.forEach((activity) => {
    const ruleSet =
      ruleSets.find((ruleSet) => {
        return ruleSet.className === activity.details.className && ruleSet.os === os.platform()
      }) ||
      ruleSets.find((ruleSet) => {
        return ruleSet.className === '' && ruleSet.os === os.platform()
      })

    if (!ruleSet) {
      throw new Error(`No default rule set found for OS: ${os.platform()}`)
    }

    const program = ruleSet.program
    const projectName = ruleSet.getProjectName(activity)
    const details = ruleSet.getDetails(activity)
    const existingActivity = finalReport.activities.find((activity) => {
      return activity.program === program
    })

    if (existingActivity) {
      const existingProject = existingActivity.projectPeriods.find((project) => {
        return project.project === projectName
      })

      if (existingProject) {
        existingProject.periods.push({
          startDate: DateTime.fromMillis(activity.start).toFormat('yyyy-LL-dd HH:mm:ss'),
          endDate: DateTime.fromMillis(activity.end).toFormat('yyyy-LL-dd HH:mm:ss'),
          duration: DateTime.fromMillis(activity.end)
            .diff(DateTime.fromMillis(activity.start))
            .shiftTo('hours', 'minutes', 'seconds')
            .toHuman({
              maximumFractionDigits: 0,
              roundingIncrement: 1
            }),
          details,
          interactive: activity.details.interactive
        })
      } else {
        existingActivity.projectPeriods.push({
          project: projectName,
          periods: [
            {
              startDate: DateTime.fromMillis(activity.start).toFormat('yyyy-LL-dd HH:mm:ss'),
              endDate: DateTime.fromMillis(activity.end).toFormat('yyyy-LL-dd HH:mm:ss'),
              duration: DateTime.fromMillis(activity.end)
                .diff(DateTime.fromMillis(activity.start))
                .shiftTo('hours', 'minutes', 'seconds')
                .toHuman({
                  maximumFractionDigits: 0,
                  roundingIncrement: 1
                }),
              details,
              interactive: activity.details.interactive
            }
          ],
          totalDuration: ''
        })
      }
    } else {
      finalReport.activities.push({
        program,
        executable: activity.details.executable || '',
        projectPeriods: [
          {
            project: projectName,
            periods: [
              {
                startDate: DateTime.fromMillis(activity.start).toFormat('yyyy-LL-dd HH:mm:ss'),
                endDate: DateTime.fromMillis(activity.end).toFormat('yyyy-LL-dd HH:mm:ss'),
                duration: DateTime.fromMillis(activity.end)
                  .diff(DateTime.fromMillis(activity.start))
                  .shiftTo('hours', 'minutes', 'seconds')
                  .toHuman({
                    maximumFractionDigits: 0,
                    roundingIncrement: 1
                  }),
                details,
                interactive: activity.details.interactive
              }
            ],
            totalDuration: ''
          }
        ],
        totalDuration: ''
      })
    }
  })

  return finalReport
}

export const DataProcessor = {
  processRawData
}
