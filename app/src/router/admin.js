import Admin from '@/views/admin/Admin.vue'
import AdminRequests from '@/views/admin/AdminRequests.vue'
import AdminUsers from '@/views/admin/AdminUsers.vue'

export default {
  path: '/admin',
  name: 'admin',
  component: Admin,
  redirect: { name: 'adminRequests' },
  meta: {
    requiresAdmin: true
  },
  children: [
    {
      path: 'requests',
      name: 'adminRequests',
      component: AdminRequests
    },
    {
      path: 'users',
      name: 'adminUsers',
      component: AdminUsers
    }
  ]
}
