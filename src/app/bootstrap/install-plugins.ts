import type { App } from 'vue'

import { router } from '@/router'

export function installPlugins(app: App) {
  app.use(router)
}
