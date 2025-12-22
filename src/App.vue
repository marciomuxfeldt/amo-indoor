<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { storage } from '@/services/storage'

onMounted(async () => {
  await storage.init()
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>