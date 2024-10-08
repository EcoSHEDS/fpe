import Manage from '@/views/manage/Manage.vue'
import ManageStation from '@/views/manage/Station.vue'
import ManageMetadata from '@/views/manage/station/Metadata.vue'
import ManageDatasets from '@/views/manage/station/Datasets.vue'
import ManageDataset from '@/views/manage/station/Dataset.vue'
import ManageImagesets from '@/views/manage/station/Imagesets.vue'
import ManageImageset from '@/views/manage/station/Imageset.vue'
import ManageModels from '@/views/manage/station/Models.vue'
import NewDataset from '@/views/manage/new/NewDataset.vue'
import NewImageset from '@/views/manage/new/NewImageset.vue'
import ManagePermissions from '@/views/manage/station/Permissions.vue'

export default [
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
        path: 'permissions',
        name: 'managePermissions',
        component: ManagePermissions
      },
      {
        path: 'models',
        name: 'manageModels',
        component: ManageModels
      }
    ]
  }
]
