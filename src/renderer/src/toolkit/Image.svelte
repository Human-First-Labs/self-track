<script lang="ts">
  import defaultPlaceholder from './assets/placeholder-image.jpg'
  import Spinner from './svgs/Spinner.svelte'

  interface Props {
    /** This is the string that will serve as a the source for this image*/
    src: string
    /** This is the placeholder that will take the sources place if the source is an empty string or image fails*/
    placeholderSrc?: string
    /** This is the string that will serve as alt information*/
    alt: string
  }
  const { src, placeholderSrc, alt }: Props = $props()

  let loading = $state(src ? true : false)
  let error = $state(src ? false : true)

  const handleLoad = () => {
    console.log('loaded!')
    loading = false
    error = false
  }

  const handleError = () => {
    console.log('!error')
    error = true
    loading = false
  }
</script>

<div class={['image-container', `${loading}`]}>
  <img
    {src}
    {alt}
    onload={handleLoad}
    onerror={handleError}
    class={[`${error ? 'actualImageError' : ''}`]}
  />
  {#if loading}
    <Spinner />
  {:else if error}
    <img src={placeholderSrc || defaultPlaceholder} {alt} class={[error]} />
  {/if}
</div>

<style>
  .image-container {
    display: flex;
    position: relative; /* For positioning the placeholder and spinner */
  }

  img {
    object-fit: contain;
  }

  .actualImageError {
    display: none;
  }

  .error {
    border: var(--error-color) solid 1px;
  }

  .loading {
    background-color: var(--background-color);
  }
</style>
