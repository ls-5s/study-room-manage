import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { initializeTheme } from './utils/theme'
import 'element-plus/theme-chalk/base.css'
// Programmatic APIs (ElMessage / ElMessageBox) are not resolved by unplugin-vue-components,
// so their component styles must be imported explicitly; without them the message box renders
// as an unstyled block in the top-left corner.
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import './styles/main.css'

initializeTheme()

createApp(App).use(createPinia()).use(router).mount('#app')
