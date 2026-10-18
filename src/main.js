import { createApp } from 'vue'
import '@fontsource/great-vibes/400.css'
import '@fontsource/cinzel/500.css'
import '@fontsource/cinzel/600.css'
import '@fontsource/bebas-neue/400.css'
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/lilita-one/400.css'
import App from './App.vue'
import { polyfillCanvas } from './lib/polyfill.js'
import './styles/shell.css'

polyfillCanvas()
createApp(App).mount('#app')
