<script lang="ts">
  import './toolkit/default-hfl.css'
  import Footer from './Footer.svelte'

  let info = $state('')

  window.api.onWindowInfo((_, windowInfo) => {
    info = `${JSON.stringify(windowInfo)}`
  })
</script>

<div id="windowInfo">{info}</div>
<Footer />
