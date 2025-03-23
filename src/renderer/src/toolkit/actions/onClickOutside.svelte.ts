import { onMount } from 'svelte'

export const clickOutside = (
  element: Node,
  args: {
    callbackFunction: () => void
    skipFirst?: boolean
  }
) => {
  const { callbackFunction, skipFirst } = args

  let initialClick = skipFirst

  const onClick: (this: HTMLElement, ev: MouseEvent) => unknown = (event) => {
    if (initialClick) {
      initialClick = false
      return
    }
    if (!element.contains(event.target as Node)) {
      callbackFunction()
    }
  }

  onMount(() => {
    document.body.addEventListener('click', onClick)
    return () => {
      document.body.removeEventListener('click', onClick)
    }
  })
}
