import { onDestroy, onMount } from 'svelte'

export const inView = (
  el: Node,
  args: {
    callbackFunction: () => void
    revertFunction?: () => void
  }
) => {
  const { callbackFunction, revertFunction } = args

  let observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callbackFunction()
      } else if (revertFunction) {
        revertFunction()
      }
    })
  })

  onMount(() => {
    console.log('onMount')
    observer.observe(el)
  })

  onDestroy(() => {
    console.log('onDestroy')
    observer.disconnect()
  })
}
