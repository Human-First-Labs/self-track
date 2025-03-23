<script lang="ts">
  import type { Snippet } from 'svelte'

  interface Props {
    /** This is just the text */
    children: Snippet
  }

  const { children }: Props = $props()
</script>

<div class="card">
  {@render children()}
</div>

<style>
  .card {
    display: flex;
    flex-direction: column;
    background-color: var(--background-color);
    box-shadow:
      0 4px 8px 0 rgba(0, 0, 0, 0.2),
      0 6px 20px 0 rgba(0, 0, 0, 0.19);
    border-radius: 16px;
    padding: 10px;
  }
</style>
