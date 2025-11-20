<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Error Occurred" v-if="error" class="ma-4">{{ error }}</Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="users"
      :loading="loading"
      :sort-by="['updated_at']"
      :sort-desc="[true]"
      :search="search"
      :custom-filter="customFilter"
      loading-text="Loading... Please wait"
      @click:row="select"
      single-select
      class="row-cursor-pointer"
      v-else>
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Users</div>
          <v-btn
            color="primary"
            outlined
            @click="fetch"
            class="ml-4"
            small
            rounded
          >
            <v-icon small left v-if="!loading">mdi-refresh</v-icon>
            <v-progress-circular
              indeterminate
              size="14"
              width="2"
              class="mr-2"
              v-else
            ></v-progress-circular>
            Refresh
          </v-btn>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            clearable
            class="mx-8"
            style="max-width: 300px;"
          ></v-text-field>
          <v-spacer></v-spacer>
          <v-btn color="success" @click="createUser">
            <v-icon left>mdi-plus</v-icon> New User
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | formatTimestamp('local', 'DD t') }}
      </template>
      <template v-slot:item.id="{ item }">
        {{ item.id.substr(1, 7) }}...
      </template>
      <template v-slot:item.is_admin="{ item }">
        <v-icon v-if="item.is_admin" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <template v-slot:item.enabled="{ item }">
        <v-icon v-if="item.enabled" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <template v-slot:item.training_required="{ item }">
        <v-icon v-if="item.training_required" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <template v-slot:item.training_complete="{ item }">
        <v-icon v-if="item.training_complete" color="primary">mdi-check-circle</v-icon>
        <v-icon v-else color="gray">mdi-close-circle</v-icon>
      </template>
      <template v-slot:item.status="{ item }">
        <v-chip
          v-if="item.status==='CONFIRMED'"
          small
          label
          color="gray"
        >
          {{ item.status }}
        </v-chip>
        <v-chip
          v-else
          small
          label
          color="warning"
        >
          {{ item.status }}
        </v-chip>
      </template>
      <template v-slot:footer.prepend>
        <div class="d-flex align-center">
          <v-btn
            color="primary"
            @click="downloadCSV"
            :disabled="!users.length"
            outlined
            small
            class="mt-2 ml-4"
          >
            <v-icon left>mdi-download</v-icon> Download CSV
          </v-btn>
        </div>
      </template>
    </v-data-table>

    <AdminCreateUser ref="createUserForm"></AdminCreateUser>
    <AdminEditUser ref="editUserForm"></AdminEditUser>
  </div>
</template>

<script>
import AdminCreateUser from '@/components/admin/AdminCreateUser'
import AdminEditUser from '@/components/admin/AdminEditUser'
export default {
  name: 'AdminUsers',
  components: {
    AdminCreateUser,
    AdminEditUser
  },
  data: () => ({
    loading: false,
    error: null,
    users: [],
    search: '',
    headers: [
      {
        text: 'ID',
        value: 'id',
        align: 'left'
      },
      {
        text: 'Name',
        value: 'attributes.name',
        align: 'left'
      },
      {
        text: 'Email',
        value: 'attributes.email',
        align: 'left'
      },
      {
        text: 'Admin',
        value: 'is_admin',
        align: 'left'
      },
      {
        text: 'Enabled',
        value: 'enabled',
        align: 'left'
      },
      {
        text: 'Training Required',
        value: 'training_required',
        align: 'left'
      },
      {
        text: 'Training Complete',
        value: 'training_complete',
        align: 'left'
      },
      {
        text: 'Created',
        value: 'created_at',
        align: 'left'
      },
      {
        text: 'Status',
        value: 'status',
        align: 'left'
      }
    ]
  }),
  mounted () {
    this.fetch()
  },
  methods: {
    async fetch () {
      this.loading = true
      this.error = null
      try {
        const response = await this.$http.admin.get('/users')
        const users = response.data
        users.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
        })
        this.users = users
      } catch (err) {
        console.error(err)
        if (err.response && err.response.data) {
          this.error = err.response.data.message || err.toString()
        } else {
          this.error = err.message || err.toString()
        }
      } finally {
        this.loading = false
      }
    },
    async select (user, row) {
      const saved = await this.$refs.editUserForm.open(user.id)
      if (saved) {
        return await this.fetch()
      }
    },
    async createUser () {
      const userCreated = await this.$refs.createUserForm.open()
      if (userCreated) {
        await this.fetch()
      }
    },
    customFilter (value, search, item) {
      if (search == null || search === '') return true

      const searchLower = search.toString().toLowerCase()
      const nameLower = item.attributes.name.toLowerCase()
      const emailLower = item.attributes.email.toLowerCase()

      return nameLower.includes(searchLower) || emailLower.includes(searchLower)
    },
    downloadCSV () {
      // Create CSV header row
      const headers = [
        'ID',
        'Name',
        'Email',
        'Admin',
        'Enabled',
        'Created',
        'Status'
      ]

      // Convert users data to CSV rows
      const rows = this.users.map(user => [
        user.id,
        user.attributes.name,
        user.attributes.email,
        user.is_admin ? 'Yes' : 'No',
        user.enabled ? 'Yes' : 'No',
        user.created_at.toISOString(),
        user.status
      ])

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
      ].join('\n')

      // Create and trigger download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      const filename = 'fpe-users-' + new Date().toISOString().split('T')[0].replace(/-/g, '') + '.csv'
      link.setAttribute('download', filename)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }
}
</script>
