<script lang="ts">
  import { onDestroy, onMount, type Snippet } from 'svelte'
  import { fly } from 'svelte/transition'

  interface Props {
    /** Whats inside the box */
    children: Snippet
    /** Boxes position*/
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
    /** Period to remove*/
    period?: number
    /** Run some function on end*/
    onEnd?: () => void
  }

  const { children, position, period, onEnd }: Props = $props()

  let flyInOptions = $derived.by(() => {
    switch (position) {
      case 'top-left':
        return {
          x: -100,
          y: -100
        }
      case 'top-right':
        return {
          x: 100,
          y: -100
        }
      case 'bottom-left':
        return {
          x: -100,
          y: 100
        }
      case 'bottom-right':
        return {
          x: 100,
          y: 100
        }
    }
  })

  let flyOutOptions = $derived.by(() => {
    switch (position) {
      case 'top-left':
        return {
          x: -100,
          y: -100
        }
      case 'top-right':
        return {
          x: 100,
          y: -100
        }
      case 'bottom-left':
        return {
          x: -100,
          y: 100
        }
      case 'bottom-right':
        return {
          x: 100,
          y: 100
        }
    }
  })

  let timeout: NodeJS.Timeout | null = null

  onMount(() => {
    if (timeout) {
      clearTimeout(timeout)
    }

    if (period) {
      timeout = setTimeout(() => {
        if (onEnd) {
          onEnd()
        }
      }, period)
    }
  })

  onDestroy(() => {
    if (timeout) {
      clearTimeout(timeout)
    }
  })
</script>

<div
  in:fly={flyInOptions}
  out:fly={flyOutOptions}
  class={[
    position.includes('top') ? 'top' : 'bottom',
    position.includes('left') ? 'left' : 'right'
  ]}
>
  {@render children()}
</div>

<style>
  div {
    position: fixed;
    background-color: var(--primary-color);
    border-radius: 5px;
    padding: 10px;
    z-index: 10;
    border: 1px solid var(--secondary-color);
  }

  .top {
    top: 15px;
  }

  .bottom {
    bottom: 15px;
  }

  .left {
    left: 15px;
  }

  .right {
    right: 15px;
  }
</style>
