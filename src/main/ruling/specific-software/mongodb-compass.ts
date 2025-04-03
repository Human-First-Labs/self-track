import { ActivityPeriod, RuleSet } from '../../entities'
import { cleanUpText } from './utils'

const getDetails = (info: ActivityPeriod): string => {
  let cleanedTitle = cleanUpText(info.details.title)
  cleanedTitle = cleanedTitle.replace('MongoDB Compass - ', '')

  const databaseAndTableName = cleanedTitle.split('/')[1]

  return databaseAndTableName
}

const getProjectName = (info: ActivityPeriod): string => {
  let cleanedTitle = cleanUpText(info.details.title)
  cleanedTitle = cleanedTitle.replace('MongoDB Compass - ', '')

  const connectionName = cleanedTitle.split('/')[0]

  return connectionName
}

const program = 'MongoDB Compass'
const className = 'mongodb compass'

export const mongoDbCompassRules: RuleSet[] = [
  {
    className,
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    className,
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
