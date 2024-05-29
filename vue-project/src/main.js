import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

var app = createApp(App);

import Tres from '@tresjs/core'
app.use(Tres);

app.mount('#app');
