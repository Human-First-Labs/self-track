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


export const mongoDbCompassRules: RuleSet[] = [
  {
    executableNames: ['MongoDB Compass'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    executableNames: ['MongoDBCompass.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
