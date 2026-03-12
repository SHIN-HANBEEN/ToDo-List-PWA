import { createApp } from 'vue'

import AppRoot from '@/app/AppRoot.vue'

export function createTodoApp() {
  return createApp(AppRoot)
}
