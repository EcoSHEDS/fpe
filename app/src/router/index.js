import Vue from 'vue'
import VueRouter from 'vue-router'

import store from '@/store'
import { getUser } from '@/lib/auth'

import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import UserGuide from '@/views/UserGuide.vue'
import Models from '@/views/Models.vue'

import AuthRoutes from '@/router/auth'
import AdminRoutes from '@/router/admin'
import ExplorerRoutes from '@/router/explorer'
import ManageRoutes from '@/router/manage'

import NotFound from '@/views/NotFound.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/about',
    name: 'about',
    component: About
  },
  {
    path: '/user-guide',
    name: 'user-guide',
    component: UserGuide
  },
  {
    path: '/models',
    name: 'models',
    component: Models
  },
  ...ExplorerRoutes,
  ...ManageRoutes,
  AdminRoutes,
  AuthRoutes,
  {
    path: '*',
    name: 'notfound',
    component: NotFound
  }
]

const router = new VueRouter({
  routes
})

let loaded = false
router.beforeEach(async (to, from, next) => {
  if (!loaded) {
    await getUser(true)
    loaded = true
  }
  if (to.matched.some(record => record.meta.requiresAuth)) {
    let user = store.getters.user
    if (!user) {
      user = await getUser()
    }
    if (!user) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
