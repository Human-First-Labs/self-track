import { ActivityPeriod, RuleSet } from '../../entities'
import { cleanUpText } from './utils'

const getDetails = (info: ActivityPeriod): string => {
  const cleanedTitle = cleanUpText(info.details.title)

  const splitTitle = cleanedTitle.split(' - ')
  const splitTitleLength = splitTitle.length
  if (splitTitleLength === 3) {
    return splitTitle[0]
  } else {
    console.log('Weird title format here', cleanedTitle)
    if (splitTitle[0]) {
      return splitTitle[0]
    } else {
      return cleanedTitle
    }
  }
}

const getProjectName = (info: ActivityPeriod): string => {
  const cleanedTitle = cleanUpText(info.details.title)

  const splitTitle = cleanedTitle.split(' - ')
  const splitTitleLength = splitTitle.length
  if (splitTitleLength === 3) {
    return splitTitle[1]
  } else {
    console.log('Weird title format here', cleanedTitle)
    if (splitTitle[1]) {
      return splitTitle[1]
    } else {
      return cleanedTitle
    }
  }
}

const title = 'Visual Studio Code'
const className = 'code'

export const vsCodeRules: RuleSet[] = [
  {
    className,
    os: 'linux',
    getDetails,
    getProjectName,
    title
  },
  {
    className,
    os: 'win32',
    getDetails,
    getProjectName,
    title
  }
]
