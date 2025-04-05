import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  const splitTitle = info.details.title.split(' - ')
  const splitTitleLength = splitTitle.length
  if (splitTitleLength === 3) {
    return splitTitle[0]
  } else if (splitTitleLength < 3) {
    return ''
  } else {
    return info.details.title
  }
}

const getProjectName = (info: ActivityPeriod): string => {
  const splitTitle = info.details.title.split(' - ')
  const splitTitleLength = splitTitle.length
  if (splitTitleLength === 3) {
    return splitTitle[1]
  } else if (splitTitleLength === 2) {
    return splitTitle[0]
  } else if (splitTitleLength < 2) {
    return ''
  } else {
    return info.details.title
  }
}

const program = 'Visual Studio Code'
// const classNames = ['code']

export const vsCodeRules: RuleSet[] = [
  {
    // classNames,
    executableNames: ['code'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    // classNames,
    executableNames: ['Code.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
