import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  let cleanedTitle = info.details.title
  cleanedTitle = cleanedTitle.replace(' - Google Chrome', '')

  return cleanedTitle
}

const getProjectName = (): string => {
  return ''
}

const program = 'Google Chrome'

export const chromeRules: RuleSet[] = [
  {
    executableNames: ['chrome'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    executableNames: ['chrome.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
