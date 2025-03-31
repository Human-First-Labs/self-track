import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
    // build: {
    //   rollupOptions: {
    //     external: ['node-desktop-idle-v2'] // Mark the module as external
    //   }
    // }
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
    // build: {
    //   rollupOptions: {
    //     external: ['node-desktop-idle-v2'] // Mark the module as external
    //   }
    // }
  },
  renderer: {
    plugins: [svelte()]
  }
})
