import { createApp } from 'vue'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import './assets/main.css'
import App from './App.vue'
import router from './router/index.js'
import { i18n, setLocale } from './i18n/index.js'

setLocale(i18n.global.locale.value)

createApp(App).use(router).use(i18n).mount('#app')
