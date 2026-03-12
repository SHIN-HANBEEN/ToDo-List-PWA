import { registerSW } from 'virtual:pwa-register'

import { createTodoApp } from '@/app/bootstrap/create-app'
import { installPlugins } from '@/app/bootstrap/install-plugins'
import { setupTheme } from '@/app/bootstrap/setup-theme'
import '@/style.css'

setupTheme()

const app = createTodoApp()

installPlugins(app)
app.mount('#app')

// 서비스워커를 초기에 등록해 업데이트를 자동으로 수신.
registerSW({ immediate: true })
