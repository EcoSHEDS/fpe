<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <div>
    <Alert type="error" title="Error Occurred" v-if="error" class="ma-4">{{ error }}</Alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="accounts"
      :loading="loading"
      :sort-by="['pending']"
      :sort-desc="[true]"
      :search="search"
      :custom-filter="customFilter"
      loading-text="Loading... Please wait"
      @click:row="createUser"
      single-select
      class="row-cursor-pointer"
      v-else>
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Account Requests</div>
          <RefreshButton :loading="loading" @click="fetch"></RefreshButton>
          <v-text-field
            v-model="search"
            append-icon="mdi-magnify"
            label="Search"
            single-line
            hide-details
            class="mx-8"
            clearable
            style="max-width: 300px;"
          ></v-text-field>
          <v-spacer></v-spacer>
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | formatTimestamp('local', 'DD t') }}
      </template>
      <template v-slot:item.pending="{ item }">
        <v-chip
          v-if="item.pending"
          small
          label
          color="warning"
          class="font-weight-bold"
        >
          PENDING
        </v-chip>
        <v-chip
          v-else
          small
          label
          color="gray"
        >
          NOT PENDING
        </v-chip>
      </template>
    </v-data-table>

    <AdminCreateUser ref="createUserForm"></AdminCreateUser>
  </div>
</template>

<script>
import AdminCreateUser from '@/components/admin/AdminCreateUser'
export default {
  name: 'AdminRequests',
  components: {
    AdminCreateUser
  },
  data: () => ({
    loading: false,
    error: null,
    accounts: [],
    search: '',
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
        value: 'name',
        align: 'left'
      },
      {
        text: 'Email',
        value: 'email',
        align: 'left'
      },
      {
        text: 'Affiliation (Code)',
        value: 'affiliation_code',
        align: 'left'
      },
      {
        text: 'Affiliation (Name)',
        value: 'affiliation_name',
        align: 'left'
      },
      {
        text: 'Status',
        value: 'pending',
        align: 'right'
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
        const response = await this.$http.admin.get('/requests')
        const accounts = response.data
        accounts.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
        })
        this.accounts = accounts
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    async createUser (request) {
      const user = await this.$refs.createUserForm.open(request)
      if (user) {
        await this.$http.admin.put(`/requests/${request.id}`, {
          pending: false
        })
      }
      this.fetch()
    },
    customFilter (value, search, item) {
      if (search == null || search === '') return true

      const searchLower = search.toString().toLowerCase()
      const nameLower = item.name.toLowerCase()
      const emailLower = item.email.toLowerCase()

      return nameLower.includes(searchLower) || emailLower.includes(searchLower)
    }
  }
}
</script>
