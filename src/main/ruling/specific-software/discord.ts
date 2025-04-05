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
    // classNames,
    executableNames: ['discord'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    // classNames,
    executableNames: ['Discord.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
