import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Login from '@/views/Login.vue'
import Workspace from '@/views/Workspace.vue'
import Studio from '@/views/StudioDrama.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'home', component: Home },
    { path: '/login', name: 'login', component: Login },
    { path: '/workspace', name: 'workspace', component: Workspace, meta: { requiresAuth: true } },
    { path: '/studio', name: 'studio', component: Studio, meta: { requiresAuth: true } },
  ],
})

router.beforeEach((to, from, next) => {
  if (to.meta && to.meta.requiresAuth) {
    const loggedIn = typeof localStorage !== 'undefined' && localStorage.getItem('loggedIn') === 'true'
    if (!loggedIn && to.name !== 'login') {
      next({ name: 'login' })
      return
    }
  }
  next()
})

export default router