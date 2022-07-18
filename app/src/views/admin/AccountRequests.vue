<template>
  <div>
    <v-alert
      type="error"
      text
      colored-border
      border="left"
      class="body-2 mb-0"
      v-if="error"
    >
      <div class="body-1 font-weight-bold">Error Occurred</div>
      <div>{{ error }}</div>
    </v-alert>

    <v-data-table
      ref="table"
      :headers="headers"
      :items="accounts"
      :loading="loading"
      :sort-by="['created_at']"
      :sort-desc="[true]"
      loading-text="Loading... Please wait"
      single-select
      class="row-cursor-pointer"
      v-else>
      <template v-slot:top>
        <v-toolbar flat>
          <div class="text-h5">Account Requests</div>
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
        </v-toolbar>
        <v-divider></v-divider>
      </template>

      <!-- eslint-disable-next-line vue/valid-v-slot -->
      <template v-slot:item.created_at="{ item }">
        {{ item.created_at | timestampFormat('ll') }}
      </template>
    </v-data-table>
  </div>
</template>

<script>
export default {
  name: 'AccountRequests',
  data: () => ({
    loading: false,
    error: null,
    accounts: [],
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
        const response = await this.$http.admin.get('/account-requests')
        const accounts = response.data
        accounts.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
        })
        this.accounts = accounts
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
    }
  }
}
</script>
