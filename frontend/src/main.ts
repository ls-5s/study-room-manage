import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeTheme } from './utils/theme'
import 'element-plus/theme-chalk/base.css'
import './styles/main.css'

initializeTheme()

createApp(App).use(createPinia()).use(router).mount('#app')
