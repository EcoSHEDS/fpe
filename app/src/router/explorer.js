import Explorer from '@/views/explorer/Explorer.vue'
import ExplorerStation from '@/views/explorer/Station.vue'

export default [
  {
    path: '/explorer',
    name: 'explorer',
    component: Explorer
  },
  {
    path: '/explorer/:stationId',
    name: 'explorerStation',
    component: ExplorerStation
  }
]
