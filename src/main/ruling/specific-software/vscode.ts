import { ActivityPeriod, RuleSet } from '../../entities'
import { cleanUpText } from './utils'

const getDetails = (info: ActivityPeriod): string => {
  const splitTitle = info.details.title.split(' - ')
  const splitTitleLength = splitTitle.length
  if (splitTitleLength === 3) {
    return cleanUpText(splitTitle[0])
  } else if (splitTitleLength < 3) {
    return ''
  } else {
    return cleanUpText(info.details.title)
  }
}

const getProjectName = (info: ActivityPeriod): string => {
  const splitTitle = info.details.title.split(' - ')
  const splitTitleLength = splitTitle.length
  if (splitTitleLength === 3) {
    return cleanUpText(splitTitle[1])
  } else if (splitTitleLength === 2) {
    return cleanUpText(splitTitle[0])
  } else if (splitTitleLength < 2) {
    return ''
  } else {
    return cleanUpText(info.details.title)
  }
}

const program = 'Visual Studio Code'
const className = 'code'

export const vsCodeRules: RuleSet[] = [
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
