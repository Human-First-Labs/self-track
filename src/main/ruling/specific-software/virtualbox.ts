import { ActivityPeriod, RuleSet } from '../../entities'

const getDetails = (info: ActivityPeriod): string => {
  const cleanedTitle = info.details.title
  if (cleanedTitle.includes(' - Oracle VM VirtualBox')) {
    return 'Working on Virtual Machine'
  } else {
    return cleanedTitle
  }
}

const getProjectName = (info: ActivityPeriod): string => {
  let cleanedTitle = info.details.title

  if (cleanedTitle.includes(' - Oracle VM VirtualBox')) {
    const splitTitle = cleanedTitle.split(' - ')
    const vmName = splitTitle[0]

    //clean up running status
    cleanedTitle = vmName.replace('/[.*]/', '')

    return cleanedTitle
  }

  return ''
}

const program = 'VirtualBox'
// const classNames: string[] = [
//   'VirtualBox Manager',
//   'VirtualBox',
//   'VirtualBox Machine',
//   'VirtualBoxVM'
// ]

export const virtualBoxRules: RuleSet[] = [
  {
    // classNames,
    executableNames: ['VirtualBox', 'VirtualBoxVM'],
    os: 'linux',
    getDetails,
    getProjectName,
    program
  },
  {
    // classNames,
    executableNames: ['VirtualBox.exe'],
    os: 'win32',
    getDetails,
    getProjectName,
    program
  }
]
