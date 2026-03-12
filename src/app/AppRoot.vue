<script setup lang="ts">
import { RouterView } from 'vue-router'

import WebAppShell from '@/app/layouts/WebAppShell.vue'
</script>

<template>
  <RouterView v-slot="{ Component }">
    <WebAppShell>
      <component :is="Component" v-if="Component" />
    </WebAppShell>
  </RouterView>
</template>
