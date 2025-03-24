<script lang="ts">
  import { onMount } from 'svelte'
  import { slide } from 'svelte/transition'

  let ready = $state(false)

  let version = $state('')
  window.api.getVersion((_, ver) => {
    version = ver
  })

  onMount(() => (ready = true))
</script>

{#if ready}
  <footer
    in:slide={{
      axis: 'y'
    }}
  >
    <div>
      <small>{version}</small>
    </div>
    <div class="right-stuff">
      <small
        >Built with the aid of <a
          class="hfl-a"
          target="_blank"
          rel="noreferrer"
          href="https://human-first-labs.com">Human First Labs (HFL)</a
        ></small
      >
    </div>
  </footer>
{/if}

<style>
  footer {
    position: fixed;
    bottom: 0;
    display: flex;
    height: var(--topbar-mobile-height);
    background-color: var(--primary-color);
    width: 100%;
    align-items: center;
    justify-content: space-between;
    padding: 20px;
  }

  small {
    color: var(--primary-contrast-color);
  }

  .right-stuff {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
