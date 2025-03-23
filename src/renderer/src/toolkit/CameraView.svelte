<script lang="ts">
  import { onDestroy, onMount } from 'svelte'

  let canvas: HTMLCanvasElement | null = null
  let webcamStream: MediaStream | null = null
  let video: HTMLVideoElement | null = null
  let ctx: CanvasRenderingContext2D | null = null

  const {
    containingClass,
    addImageLink,
    skipConfirmation
  }: {
    skipConfirmation?: boolean
    containingClass?: string
    addImageLink: (newLink: string) => void
  } = $props()

  let error = $state('')
  let mode = $state<'Taking' | 'Confirming'>('Taking')
  let loading = $derived(canvas && webcamStream && video && ctx)

  const initialize = async () => {
    try {
      if (!webcamStream || !video) {
        webcamStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: true
        })
        video = document.getElementById('camera-view') as HTMLVideoElement
      }

      video.srcObject = webcamStream

      video.play()
      const camSettings = webcamStream.getVideoTracks()[0].getSettings()
      canvas = document.getElementById('camera-canvas') as HTMLCanvasElement
      ctx = canvas.getContext('2d')
      if (camSettings.width) {
        canvas.width = camSettings.width
      }
      if (camSettings.height) {
        canvas.height = camSettings.height
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        error = err.message
      } else {
        error = 'error obtaining navigator.mediaDevices.getUserMedia'
      }
    }
  }

  const takePhoto = () => {
    if (video) {
      if (skipConfirmation) {
        savePhoto()
      } else {
        video.pause()
        mode = 'Confirming'
      }
    }
  }

  const discardPhoto = () => {
    if (video) {
      video.play()
      mode = 'Taking'
    }
  }

  const savePhoto = () => {
    if (webcamStream && ctx && video && canvas) {
      ctx.drawImage(video, 0, 0)
      addImageLink(canvas.toDataURL())
      video.play()
      mode = 'Taking'
    }
  }

  onMount(() => {
    initialize()
  })

  onDestroy(() => {
    if (video && video.srcObject && webcamStream) {
      const videoTracks = webcamStream.getVideoTracks()
      videoTracks.forEach((track) => {
        track.stop()
      })

      video.srcObject = null
      webcamStream = null
    }
  })
</script>

{#if loading}
  <p>loading....</p>
{:else if error}
  <div>
    <p class="error">{error}</p>
    <button onclick={initialize}>Retry</button>
  </div>
{/if}
<div class={loading || error ? 'hide' : undefined}>
  <canvas id="camera-canvas" class="hide"></canvas>
  <div class={containingClass || 'camera-div'}>
    <video
      width="100%"
      height="100%"
      id="camera-view"
      onclick={() => {
        if (mode === 'Taking') {
          takePhoto()
        }
      }}
    >
      <track kind="captions" />
    </video>
    {#if mode === 'Taking'}
      <div class="instruction">
        <p>Click anyway to take photo</p>
      </div>
    {:else}
      <div class="next-instruction">
        <button class="next-instruction-part" onclick={discardPhoto}>
          <p>Discard</p>
        </button>
        <button class="next-instruction-part" onclick={savePhoto}>
          <p>Save</p>
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .hide {
    display: none;
  }
  .camera-div {
    position: relative;
    width: 400px;
    height: 600px;
    background-color: black;
  }
  .instruction {
    background-color: white;
    color: black;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    bottom: 40px;
  }
  .next-instruction {
    display: flex;
    position: absolute;
    left: 50%;
    transform: translate(-50%, 0);
    bottom: 40px;
    justify-content: space-between;
  }
  .next-instruction-part {
    background-color: white;
    color: black;
    padding: 0 10px;
    border: none;
  }
  .error {
    color: red;
  }
</style>
