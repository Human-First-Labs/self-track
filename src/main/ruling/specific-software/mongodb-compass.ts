import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  let cleanedTitle = info.details.title
  cleanedTitle = cleanedTitle.replace('MongoDB Compass - ', '')

  const databaseAndTableName = cleanedTitle.split('/')[1]

  return databaseAndTableName
}

const getProjectName = (info: ActivityPeriod): string => {
  let cleanedTitle = info.details.title
  cleanedTitle = cleanedTitle.replace('MongoDB Compass - ', '')

  const connectionName = cleanedTitle.split('/')[0]

  return connectionName
}

const program = 'MongoDB Compass'
const classNames = ['mongodb compass']

export const mongoDbCompassRules: RuleSet[] = [
  {
    classNames,
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    classNames,
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
