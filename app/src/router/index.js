import Vue from 'vue'
import VueRouter from 'vue-router'

import store from '@/store'
import { getUser } from '@/lib/auth'

import Home from '@/views/Home.vue'
import About from '@/views/About.vue'
import UserGuide from '@/views/UserGuide.vue'
import Models from '@/views/Models.vue'

import ExplorerMap from '@/views/explorer/Map.vue'
import ExplorerStation from '@/views/explorer/Station.vue'

import Manage from '@/views/manage/Manage.vue'
// import ManageInstructions from '@/views/manage/Instructions.vue'

import ManageStation from '@/views/manage/Station.vue'
import ManageMetadata from '@/views/manage/station/Metadata.vue'
import ManageDatasets from '@/views/manage/station/Datasets.vue'
import ManageDataset from '@/views/manage/station/Dataset.vue'
import ManageImagesets from '@/views/manage/station/Imagesets.vue'
import ManageImageset from '@/views/manage/station/Imageset.vue'
import ManageModels from '@/views/manage/station/Models.vue'

import NewDataset from '@/views/manage/new/NewDataset.vue'
import NewImageset from '@/views/manage/new/NewImageset.vue'

import NotFound from '@/views/NotFound.vue'

import RootAuth from '@/views/auth/RootAuth.vue'
import Account from '@/views/auth/Account.vue'
import Login from '@/views/auth/Login.vue'
import RequestAccount from '@/views/auth/RequestAccount.vue'
import Signup from '@/views/auth/Signup.vue'
import SignupConfirm from '@/views/auth/SignupConfirm.vue'
import Logout from '@/views/auth/Logout.vue'
import ChangePassword from '@/views/auth/ChangePassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'

import AdminRoot from '@/views/admin/Root.vue'
import AdminAccountRequests from '@/views/admin/AccountRequests.vue'
import AdminUsers from '@/views/admin/Users.vue'
import AdminStations from '@/views/admin/Stations.vue'

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
    path: '/explorer',
    name: 'explorer',
    component: ExplorerMap
  },
  {
    path: '/explorer/:stationId',
    name: 'exploreStation',
    component: ExplorerStation
  },
  {
    path: '/models',
    name: 'models',
    component: Models
  },
  {
    path: '/manage',
    name: 'manage',
    component: Manage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/stations/:stationId',
    component: ManageStation,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'manageStation',
        component: ManageMetadata
      },
      {
        path: 'datasets/new',
        name: 'newDataset',
        component: NewDataset
      },
      {
        path: 'imagesets/new',
        name: 'newImageset',
        component: NewImageset
      },
      {
        path: 'datasets',
        name: 'manageDatasets',
        component: ManageDatasets,
        children: [
          {
            path: ':datasetId',
            name: 'manageDataset',
            component: ManageDataset
          }
        ]
      },
      {
        path: 'imagesets',
        name: 'manageImagesets',
        component: ManageImagesets,
        children: [
          {
            path: ':imagesetId',
            name: 'manageImageset',
            component: ManageImageset
          }
        ]
      },
      {
        path: 'models',
        name: 'manageModels',
        component: ManageModels
      }
    ]
  },
  {
    path: '/auth',
    name: 'auth',
    component: RootAuth,
    redirect: { name: 'login' },
    children: [
      {
        path: 'request',
        name: 'requestAccount',
        component: RequestAccount
      },
      {
        path: 'account',
        name: 'account',
        component: Account
      },
      {
        path: 'login',
        name: 'login',
        component: Login
      },
      {
        path: 'logout',
        name: 'logout',
        component: Logout
      },
      {
        path: 'signup',
        name: 'signup',
        component: Signup
      },
      {
        path: 'confirm',
        name: 'signupConfirm',
        component: SignupConfirm
      },
      {
        path: 'change-password',
        name: 'changePassword',
        component: ChangePassword
      },
      {
        path: 'reset-password',
        name: 'resetPassword',
        component: ResetPassword
      }
    ]
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminRoot,
    redirect: { name: 'adminAccountRequests' },
    meta: {
      requiresAdmin: true
    },
    children: [
      {
        path: 'account-requests',
        name: 'adminAccountRequests',
        component: AdminAccountRequests
      },
      {
        path: 'users',
        name: 'adminUsers',
        component: AdminUsers
      },
      {
        path: 'stations',
        name: 'adminStations',
        component: AdminStations
      }
    ]
  },
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
      console.log('no user, trying again')
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
