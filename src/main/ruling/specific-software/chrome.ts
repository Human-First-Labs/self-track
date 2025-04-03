import { ActivityPeriod, RuleSet } from '../../entities'
import { cleanUpNumbersBetweenBrackets, cleanUpText } from './utils'

const getDetails = (info: ActivityPeriod): string => {
  let cleanedTitle = cleanUpText(info.details.title)
  cleanedTitle = cleanedTitle.replace(' - Google Chrome', '')

  return cleanUpNumbersBetweenBrackets(cleanedTitle)
}

const getProjectName = (): string => {
  return ''
}

const program = 'Google Chrome'
const className = 'google-chrome'

export const chromeRules: RuleSet[] = [
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
