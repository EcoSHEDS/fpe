import ExplorerHome from '@/views/explorer/ExplorerHome'
import ExplorerStation from '@/views/explorer/ExplorerStation'

export default [
  {
    path: '/explorer',
    name: 'explorerHome',
    component: ExplorerHome,
    children: [
      {
        path: ':id',
        name: 'explorerStation',
        component: ExplorerStation
      }
    ]
  }
]
