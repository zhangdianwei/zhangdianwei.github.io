// import './assets/main.css'
import 'bulma'

import { createApp } from 'vue'
import App from './App.vue'

var app = createApp(App);

import Tres from '@tresjs/core'
app.use(Tres);

app.mount('#app');
