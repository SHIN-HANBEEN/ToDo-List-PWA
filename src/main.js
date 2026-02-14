import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerSW } from 'virtual:pwa-register'

createApp(App).mount('#app')

// Register service worker early so updates can be picked up automatically.
registerSW({ immediate: true })
