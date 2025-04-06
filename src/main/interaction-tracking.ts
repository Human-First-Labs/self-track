import { desktopIdle } from 'node-desktop-idle-v2' // Library to monitor desktop idle time

// Variable to track whether the user is interacting with the system
let interaction = false

// Maximum idle time (in seconds) before considering the user inactive
const maxIdleTime = 20

// Function to check the current interaction state
const checkState = (): boolean => {
  // Get the current idle time from the desktop
  const currentIdleTime = desktopIdle.getIdleTime()

  // If the idle time exceeds the maximum allowed, set interaction to false
  if (currentIdleTime > maxIdleTime) {
    interaction = false
  } else {
    // Otherwise, set interaction to true
    interaction = true
  }

  // Return the current interaction state
  return interaction
}

// Function to start monitoring desktop idle time
const start = async (): Promise<void> => {
  desktopIdle.startMonitoring() // Begin monitoring idle time
}

// Function to stop monitoring desktop idle time
const end = (): void => {
  desktopIdle.stopMonitoring() // Stop monitoring idle time
}

// Export the InteractionTracker object with the defined functions
export const InteractionTracker = {
  start, // Start monitoring
  checkState, // Check interaction state
  end // Stop monitoring
}
