<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    /** This is just the text */
    children: Snippet
  }

  const { children }: Props = $props()
</script>

<div class="cover">
  {@render children()}
</div>

<style>
  .cover {
    display: flex;
    flex-direction: column;
    height: 100vh;
    width: 100vw;
    justify-content: center;
    align-items: center;
    position: absolute;
    z-index: 5;
    top: 0;
    left: 0;
    background-color: rgba(0, 0, 0, 0.5);
    border: none;
  }
</style>
