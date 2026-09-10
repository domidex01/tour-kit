import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import Announcements from './pages/Announcements.vue'
import Home from './pages/Home.vue'
import Settings from './pages/Settings.vue'
import Surveys from './pages/Surveys.vue'
import './style.css'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: Home },
    { path: '/settings', component: Settings },
    // v3 Phase 3 — announcements and surveys driven by their `/engine`
    // subpaths, with no React installed anywhere in this app.
    { path: '/announcements', component: Announcements },
    { path: '/surveys', component: Surveys },
  ],
})

createApp(App).use(router).mount('#app')
