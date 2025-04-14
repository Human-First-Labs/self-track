import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  let cleanedTitle = info.details.title
  cleanedTitle = cleanedTitle.replace(' - Discord', '')
  return cleanedTitle
}

const getProjectName = (): string => {
  return ''
}

const program = 'Discord'

export const discordRules: RuleSet[] = [
  {
    executableNames: ['discord'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    executableNames: ['Discord.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
