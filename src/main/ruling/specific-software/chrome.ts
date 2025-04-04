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
const classNames = ['google-chrome']

export const chromeRules: RuleSet[] = [
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
