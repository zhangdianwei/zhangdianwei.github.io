// import './assets/main.css'
// import 'bulma'

import { createApp } from 'vue'
import App from './app/App.vue'
var app = createApp(App);

import ViewUIPlus from 'view-ui-plus'
import 'view-ui-plus/dist/styles/viewuiplus.css'
app.use(ViewUIPlus)

import Tres from '@tresjs/core'
app.use(Tres);

app.mount('#app');
