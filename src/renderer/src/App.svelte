<script lang="ts">
  // Importing necessary styles, components, and libraries
  import './toolkit/default-hfl.css' // Default CSS styles
  import Footer from './Footer.svelte' // Footer component
  import type { ActivityPeriod } from '../../main/entities' // Type definition for ActivityPeriod
  import { slide } from 'svelte/transition' // Svelte transition for animations
  import { DateTime } from 'luxon' // Luxon library for date and time manipulation
  import { onMount } from 'svelte' // Svelte lifecycle function

  // Reactive state variables
  let currentActivity = $state<ActivityPeriod | undefined>() // Tracks the current activity
  let recording = $state(false) // Tracks whether recording is active
  let errorMessage = $state('') // Stores any error messages
  let os = $state('') // Stores the detected operating system

  // Lifecycle function that runs when the component is mounted
  onMount(() => {
    // Listen for the OS information from the main process
    window.api.sendOS((_, currentOs) => {
      os = currentOs // Update the OS state
    })

    // Listen for window information updates
    window.api.sendWindowInfo((_, windowInfo) => {
      currentActivity = windowInfo // Update the current activity
      errorMessage = '' // Clear any previous error messages
    })

    // Listen for tracking errors
    window.api.sendTrackingError((_, error) => {
      errorMessage = error // Update the error message
    })

    // Request the OS information from the main process
    window.api.requestOs()
  })

  // Function to toggle the recording state
  const toggleRecording = (): void => {
    recording = !recording // Toggle the recording state

    if (!recording) {
      // Stop tracking if recording is turned off
      window.api.stopTracking()
    } else {
      // Start tracking if recording is turned on
      window.api.startTracking()
    }
  }

  // Function to open the exports directory
  const openDirectory = (): void => {
    window.api.openExportsDirectory() // Trigger the main process to open the directory
  }
</script>

<div class="column center">
  <small class="operating">Detected OS: {os}</small>
  <div class="centering column">
    <button class="hfl-button" onclick={toggleRecording}
      >{recording ? 'Stop' : 'Start'} Recording!</button
    >
    {#if errorMessage}
      <div class="current" in:slide={{ axis: 'y' }} out:slide={{ axis: 'y' }}>
        <h5>Error:</h5>
        <p class="error">{errorMessage}</p>
      </div>
    {:else if recording && currentActivity?.id}
      <div class="current" in:slide={{ axis: 'y' }} out:slide={{ axis: 'y' }}>
        <h5>Current Activity:</h5>
        <div class="row">
          <strong>Title:</strong>
          <p>{currentActivity.details.title}</p>
        </div>
        <div class="row">
          <strong>Executable:</strong>
          <p>{currentActivity.details.executable}</p>
        </div>
        <!-- <div class="row">
          <strong>Class:</strong>
          <p>{currentActivity.details.className}</p>
        </div> -->
        <div class="row">
          <strong>Interactive:</strong>
          <p>{currentActivity.details.interactive}</p>
        </div>
        <div class="row">
          <strong>Start:</strong>
          <p>
            {DateTime.fromMillis(currentActivity.start).toFormat('yy/MM/dd HH:mm')}
          </p>
        </div>
        <div class="row">
          <strong>Duration:</strong>
          <p>
            {DateTime.fromMillis(currentActivity.end)
              .diff(DateTime.fromMillis(currentActivity.start))
              .shiftTo('hours', 'minutes', 'seconds')
              .toHuman({
                maximumFractionDigits: 0,
                roundingIncrement: 1
              })}
          </p>
        </div>
      </div>
    {/if}
  </div>
  <button class="hidden-button export-btn" onclick={openDirectory}>Open Export Directory</button>
</div>
<Footer />

<style>
  .column {
    flex: 1;
    flex-wrap: nowrap;
  }

  .hfl-button {
    padding: 20px;
  }

  .center {
    align-items: center;
    justify-content: center;
    margin: 10px;
    flex: 1;
  }

  .current {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  p {
    flex: 1;
    margin: 0;
  }

  strong {
    flex: 0.5;
  }

  .operating {
    font-weight: bold;
    text-align: start;
    width: 100%;
  }

  .centering {
    display: flex;
    height: 100%;
    width: 100%;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }

  .export-btn {
    color: var(--primary-color);
  }

  .error {
    color: var(--error-color);
  }
</style>
