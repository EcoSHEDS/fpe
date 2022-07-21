import Auth from '@/views/auth/Auth.vue'
import Account from '@/views/auth/Account.vue'
import Login from '@/views/auth/Login.vue'
import Request from '@/views/auth/Request.vue'
import ChangePassword from '@/views/auth/ChangePassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'
import Setup from '@/views/auth/Setup.vue'

export default {
  path: '/auth',
  name: 'auth',
  component: Auth,
  redirect: { name: 'login' },
  children: [
    {
      path: 'request',
      name: 'request',
      component: Request
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
      path: 'change-password',
      name: 'changePassword',
      component: ChangePassword
    },
    {
      path: 'reset-password',
      name: 'resetPassword',
      component: ResetPassword
    },
    {
      path: 'setup',
      name: 'setup',
      component: Setup
    }
  ]
}
