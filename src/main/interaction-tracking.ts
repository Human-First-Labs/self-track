import { powerMonitor } from 'electron'

let interaction = false

const checkState = (): boolean => {
  console.log('timer', powerMonitor.getSystemIdleTime(), powerMonitor.getSystemIdleState(5))
  const currentState = powerMonitor.getSystemIdleState(60)
  if (currentState === 'active') {
    interaction = true
  } else {
    interaction = false
  }

  return interaction
}

export const InteractionTracker = {
  checkState
}
