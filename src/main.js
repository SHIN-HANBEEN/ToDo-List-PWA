import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

createApp(App).mount('#app')

// 서비스워커를 초기에 등록해 업데이트를 자동으로 수신.
registerSW({ immediate: true })
