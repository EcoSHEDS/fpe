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
          <v-spacer></v-spacer>
          <v-btn color="success" @click="createUser">
            <v-icon left>mdi-plus</v-icon> New User
          </v-btn>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestampFormat('ll') }}
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
    headers: [
      {
        text: 'ID',
        value: 'id',
        align: 'left'
      },
      {
        text: 'Created',
        value: 'created_at',
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
    }
  }
}
</script>
