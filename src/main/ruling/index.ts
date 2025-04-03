import { DateTime, Duration } from 'luxon'
import {
  ActivityPeriod,
  FinalReport,
  FinalReportProgramActivity,
  FinalReportProjectActivity
} from '../entities'
import { ruleSets } from './rule-sets'
import os from 'os'

interface FunctionalFinalReportProjectActivity extends FinalReportProjectActivity {
  totalDurationMillis: number
  totalActiveDurationMillis?: number
  totalInactiveDurationMillis?: number
}

interface FunctionalFinalReportProgramActivity extends FinalReportProgramActivity {
  totalDurationMillis: number
  totalActiveDurationMillis?: number
  totalInactiveDurationMillis?: number
  projectPeriods: FunctionalFinalReportProjectActivity[]
}

interface FunctionalFinalReport extends FinalReport {
  activities: FunctionalFinalReportProgramActivity[]
}

const convertFunctionalFunalReportToFinalReport = (
  functionalFinalReport: FunctionalFinalReport
): FinalReport => {
  const finalReport: FinalReport = {
    activities: [],
    totalDuration: functionalFinalReport.totalDuration,
    endDate: functionalFinalReport.endDate,
    startDate: functionalFinalReport.startDate
  }
  functionalFinalReport.activities.forEach((activity) => {
    const finalReportActivity: FinalReportProgramActivity = {
      program: activity.program,
      executable: activity.executable,
      projectPeriods: [],
      totalDuration: Duration.fromMillis(activity.totalDurationMillis)
        .shiftTo('hours', 'minutes', 'seconds')
        .toHuman({
          maximumFractionDigits: 0,
          roundingIncrement: 1
        })
    }
    if (activity.totalActiveDurationMillis) {
      finalReportActivity.totalActiveDuration = Duration.fromMillis(
        activity.totalActiveDurationMillis
      )
        .shiftTo('hours', 'minutes', 'seconds')
        .toHuman({
          maximumFractionDigits: 0,
          roundingIncrement: 1
        })
    }
    if (activity.totalInactiveDurationMillis) {
      finalReportActivity.totalInactiveDuration = Duration.fromMillis(
        activity.totalInactiveDurationMillis
      )
        .shiftTo('hours', 'minutes', 'seconds')
        .toHuman({
          maximumFractionDigits: 0,
          roundingIncrement: 1
        })
    }
    activity.projectPeriods.forEach((project) => {
      const finalReportProject: FinalReportProjectActivity = {
        project: project.project,
        periods: [],
        totalDuration: Duration.fromMillis(project.totalDurationMillis)
          .shiftTo('hours', 'minutes', 'seconds')
          .toHuman({
            maximumFractionDigits: 0,
            roundingIncrement: 1
          })
      }

      if (project.totalActiveDurationMillis) {
        finalReportProject.totalActiveDuration = Duration.fromMillis(
          project.totalActiveDurationMillis
        )
          .shiftTo('hours', 'minutes', 'seconds')
          .toHuman({
            maximumFractionDigits: 0,
            roundingIncrement: 1
          })
      }
      if (project.totalInactiveDurationMillis) {
        finalReportProject.totalInactiveDuration = Duration.fromMillis(
          project.totalInactiveDurationMillis
        )
          .shiftTo('hours', 'minutes', 'seconds')
          .toHuman({
            maximumFractionDigits: 0,
            roundingIncrement: 1
          })
      }
      project.periods.forEach((period) => {
        finalReportProject.periods.push({
          startDate: period.startDate,
          endDate: period.endDate,
          duration: period.duration,
          details: period.details,
          interactive: period.interactive
        })
      })
      finalReportActivity.projectPeriods.push(finalReportProject)
    })
    finalReport.activities.push(finalReportActivity)
  })
  return finalReport
}

const processRawData = (rawData: ActivityPeriod[]): FinalReport => {
  const finalReport: FunctionalFinalReport = {
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
    let interactiveDuration = Duration.fromMillis(0)
    interactivePeriods.map((activity) => {
      interactiveDuration = interactiveDuration.plus(
        DateTime.fromMillis(activity.end).diff(DateTime.fromMillis(activity.start))
      )
    })
    finalReport.totalActiveDuration = interactiveDuration
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
    let inactiveDuration = Duration.fromMillis(0)
    inactivePeriods.map((activity) => {
      inactiveDuration = inactiveDuration.plus(
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
    const currentDuration = DateTime.fromMillis(activity.end).diff(
      DateTime.fromMillis(activity.start)
    )

    const existingProgram = finalReport.activities.find((activity) => {
      return activity.program === program
    })

    if (existingProgram) {
      let totalProgramDuration = Duration.fromMillis(existingProgram.totalDurationMillis || 0)
      totalProgramDuration = totalProgramDuration.plus(currentDuration.toMillis())

      let totalProgramActiveDuration = Duration.fromMillis(
        existingProgram.totalActiveDurationMillis || 0
      )
      let totalProgramInactiveDuration = Duration.fromMillis(
        existingProgram.totalInactiveDurationMillis || 0
      )
      if (activity.details.interactive === 'active') {
        totalProgramActiveDuration = totalProgramActiveDuration.plus(currentDuration.toMillis())
      } else if (activity.details.interactive === 'inactive') {
        totalProgramInactiveDuration = totalProgramInactiveDuration.plus(currentDuration.toMillis())
      }

      const existingProject = existingProgram.projectPeriods.find((project) => {
        return project.project === projectName
      })

      if (existingProject) {
        let totalProjectDuration = Duration.fromMillis(existingProject.totalDurationMillis || 0)
        totalProjectDuration = totalProjectDuration.plus(currentDuration.toMillis())

        let totalProjectActiveDuration = Duration.fromMillis(
          existingProject.totalActiveDurationMillis || 0
        )
        let totalProjectInactiveDuration = Duration.fromMillis(
          existingProject.totalInactiveDurationMillis || 0
        )
        if (activity.details.interactive === 'active') {
          totalProjectActiveDuration = totalProjectActiveDuration.plus(currentDuration.toMillis())
        } else if (activity.details.interactive === 'inactive') {
          totalProjectInactiveDuration = totalProjectInactiveDuration.plus(
            currentDuration.toMillis()
          )
        }

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

        existingProject.totalDurationMillis = totalProjectDuration.toMillis()
        existingProject.totalActiveDurationMillis = totalProjectActiveDuration.toMillis()
        existingProject.totalInactiveDurationMillis = totalProjectInactiveDuration.toMillis()
      } else {
        existingProgram.projectPeriods.push({
          project: projectName,
          periods: [
            {
              startDate: DateTime.fromMillis(activity.start).toFormat('yyyy-LL-dd HH:mm:ss'),
              endDate: DateTime.fromMillis(activity.end).toFormat('yyyy-LL-dd HH:mm:ss'),
              duration: currentDuration.shiftTo('hours', 'minutes', 'seconds').toHuman({
                maximumFractionDigits: 0,
                roundingIncrement: 1
              }),
              details,
              interactive: activity.details.interactive
            }
          ],
          totalDuration: '',
          totalActiveDuration: '',
          totalInactiveDuration: '',
          totalDurationMillis: totalProgramDuration.toMillis(),
          totalActiveDurationMillis: totalProgramActiveDuration.toMillis(),
          totalInactiveDurationMillis: totalProgramInactiveDuration.toMillis()
        })
      }

      existingProgram.totalDurationMillis = totalProgramDuration.toMillis()
      existingProgram.totalActiveDurationMillis = totalProgramActiveDuration.toMillis()
      existingProgram.totalInactiveDurationMillis = totalProgramInactiveDuration.toMillis()
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
            totalDuration: '',
            totalActiveDuration: '',
            totalInactiveDuration: '',
            totalDurationMillis: currentDuration.toMillis(),
            totalActiveDurationMillis:
              activity.details.interactive === 'active' ? currentDuration.toMillis() : 0,
            totalInactiveDurationMillis:
              activity.details.interactive === 'inactive' ? currentDuration.toMillis() : 0
          }
        ],
        totalDuration: '',
        totalActiveDuration: '',
        totalInactiveDuration: '',
        totalDurationMillis: currentDuration.toMillis(),
        totalActiveDurationMillis:
          activity.details.interactive === 'active' ? currentDuration.toMillis() : 0,
        totalInactiveDurationMillis:
          activity.details.interactive === 'inactive' ? currentDuration.toMillis() : 0
      })
    }
  })

  return convertFunctionalFunalReportToFinalReport(finalReport)
}

export const DataProcessor = {
  processRawData
}
