import { createApp } from 'vue'
import App from './app/App.vue'
import './assets/app.css'

import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'

createApp(App).use(ViewUIPlus).mount('#app')
