import { DateTime, Duration } from 'luxon' // Library for date and time manipulation
import {
  ActivityPeriod,
  FinalReport,
  FinalReportProgramActivity,
  FinalReportProjectActivity
} from '../entities' // Importing types for activity and report structures
import { ruleSets } from './rule-sets' // Rule sets for categorizing activities
import os from 'os' // Module to detect the operating system
import ExcelJS from 'exceljs' // Library for generating Excel files
import { reportPath } from '../data-consolidation' // Path for storing reports

// Extended interfaces to include duration in milliseconds for internal calculations
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

// Function to convert an internal functional report to the final report format
const convertFunctionalFunalReportToFinalReport = (
  functionalFinalReport: FunctionalFinalReport
): FinalReport => {
  const finalReport: FinalReport = {
    activities: [],
    totalDuration: functionalFinalReport.totalDuration,
    endDate: functionalFinalReport.endDate,
    startDate: functionalFinalReport.startDate
  }

  // Process each activity in the functional report
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

    // Add active and inactive durations if available
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

    // Process each project within the activity
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

      // Add active and inactive durations for the project if available
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

      // Add each period to the project
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

// Function to process raw activity data into a final report
const processRawData = (rawData: ActivityPeriod[]): FinalReport => {
  const finalReport: FunctionalFinalReport = {
    activities: [],
    totalDuration: '',
    endDate: '',
    startDate: ''
  }

  // Determine the start and end times of the report
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

  // Calculate total active and inactive durations
  const interactivePeriods = rawData.filter((activity) => activity.details.interactive === 'active')
  if (interactivePeriods.length > 0) {
    let interactiveDuration = Duration.fromMillis(0)
    interactivePeriods.forEach((activity) => {
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

  const inactivePeriods = rawData.filter((activity) => activity.details.interactive === 'inactive')
  if (inactivePeriods.length > 0) {
    let inactiveDuration = Duration.fromMillis(0)
    inactivePeriods.forEach((activity) => {
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

  // Process each activity and categorize it based on rule sets
  rawData.forEach((activity) => {
    const ruleSet =
      ruleSets.find((ruleSet) => {
        return (
          ruleSet.executableNames.some((executableName) =>
            activity.details.executable.includes(executableName)
          ) && ruleSet.os === os.platform()
        )
      }) ||
      ruleSets.find((ruleSet) => {
        return ruleSet.executableNames.length === 0 && ruleSet.os === os.platform()
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

    // Check if the program already exists in the report
    const existingProgram = finalReport.activities.find((activity) => activity.program === program)

    if (existingProgram) {
      // Update existing program data
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

      // Check if the project already exists within the program
      const existingProject = existingProgram.projectPeriods.find(
        (project) => project.project === projectName
      )

      if (existingProject) {
        // Update existing project data
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

        // Add the period to the project
        existingProject.periods.push({
          startDate: DateTime.fromMillis(activity.start).toFormat('yyyy-LL-dd HH:mm:ss'),
          endDate: DateTime.fromMillis(activity.end).toFormat('yyyy-LL-dd HH:mm:ss'),
          duration: currentDuration.shiftTo('hours', 'minutes', 'seconds').toHuman({
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
        // Add a new project to the program
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
      // Add a new program to the report
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

// Function to generate a final Excel report from the processed data
const generateFinalExcelReport = async (data: FinalReport, rawName: string): Promise<void> => {
  const workbook = new ExcelJS.Workbook() // Create a new workbook
  const worksheet = workbook.addWorksheet('Activity Data') // Add a worksheet

  // Add headers to the worksheet
  worksheet.columns = [
    { header: 'Program', key: 'program', width: 30 },
    { header: 'Executable', key: 'executable', width: 50 },
    { header: 'Project', key: 'project', width: 20 },
    { header: 'Start Date', key: 'startDate', width: 20 },
    { header: 'End Date', key: 'endDate', width: 20 },
    { header: 'Duration', key: 'duration', width: 25 },
    { header: 'Details', key: 'details', width: 40 },
    { header: 'Interactive', key: 'interactive', width: 15 }
  ]

  // Loop through the activities and add rows to the worksheet
  data.activities.forEach((activity) => {
    activity.projectPeriods.forEach((projectPeriod) => {
      projectPeriod.periods.forEach((period) => {
        worksheet.addRow({
          program: activity.program + '\n' + activity.executable,
          project: projectPeriod.project || 'N/A',
          startDate: period.startDate,
          endDate: period.endDate,
          duration: period.duration,
          details: period.details,
          interactive: period.interactive
        })
      })
      worksheet.addRow({})
    })
  })

  // Write the workbook to a file
  await workbook.xlsx.writeFile(reportPath + `/activity_report_${rawName}.xlsx`) // Specify the output file path
}

// Export the DataProcessor object with the defined functions
export const DataProcessor = {
  processRawData, // Process raw activity data
  generateFinalExcelReport // Generate an Excel report
}
