<script lang="ts">
  import './toolkit/default-hfl.css'
  import Footer from './Footer.svelte'
  import type { ActivityPeriod } from '../../main/entities'
  import { slide } from 'svelte/transition'
  import { DateTime } from 'luxon'
  import { onMount } from 'svelte'

  let currentActivity = $state<ActivityPeriod | undefined>()
  let recording = $state(false)
  let errorMessage = $state('')

  let os = $state('')

  onMount(() => {
    window.api.sendOS((_, currentOs) => {
      os = currentOs
    })
    window.api.sendWindowInfo((_, windowInfo) => {
      currentActivity = windowInfo
      errorMessage = ''
    })
    window.api.sendTrackingError((_, error) => {
      errorMessage = error
    })

    window.api.requestOs()
  })

  const toggleRecording = (): void => {
    recording = !recording

    if (!recording) {
      window.api.stopTracking()
    } else {
      window.api.startTracking()
    }
  }

  const openDirectory = (): void => {
    window.api.openExportsDirectory()
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
        <div class="row">
          <strong>Class:</strong>
          <p>{currentActivity.details.className}</p>
        </div>
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
