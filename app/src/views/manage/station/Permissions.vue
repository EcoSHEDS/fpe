<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" md="6">
        <v-card elevation="2" height="100%">
          <v-card-title class="text-h5 py-2">
            Station Permissions
          </v-card-title>
          <v-divider></v-divider>
          <v-card-text class="black--text body-1">
            <p class="text-body-1 mb-0">Use the form below to grant access to this station to other users. This will allow other users ("collaborators") to edit the station metadata and upload images and observed data. If this station is marked as private, collaborators will also be able to view it on the Photo Explorer and Annotate pages. However, collaborators <b>will not</b> be able to delete the station or grant permissions to other users, which only the station owner can do.</p>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-text>
            <div class="font-weight-bold text-h6 black--text">Add Collaborator to Station "{{ station.name }}"</div>
            <v-form ref="form" @submit.prevent="addPermission">
              <v-text-field
                v-model="userEmail.value"
                :rules="userEmail.rules"
                :error-messages="userEmail.error"
                label="User Email"
                required
                outlined
                class="mt-4"
              ></v-text-field>
              <Alert
                v-if="addUser.error"
                type="error"
                title="Server Error"
              >{{ addUser.error }}</Alert>
              <v-btn type="submit" color="primary" :loading="addUser.loading">Add Collaborator</v-btn>
            </v-form>
          </v-card-text>
          <v-divider></v-divider>
          <v-card-text>
            <h2 class="font-weight-bold text-h6 black--text">Existing Collaborators</h2>
            <div v-if="loading" class="d-flex align-items-center justify-center my-8">
              <v-progress-circular
                indeterminate
                color="primary"
                class="mb-4"
              ></v-progress-circular>
              <div class="ml-4 text-h5">Loading...</div>
            </div>
            <Alert
              v-else-if="error"
              type="error"
              title="Server Error"
            >{{ error }}</Alert>
            <div v-else>
              <v-list>
                <v-list-item v-for="permission in permissions" :key="permission.id" class="grey lighten-4">
                  <v-list-item-content>
                    <v-list-item-title>{{ permission.user.name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ permission.user.affiliation_code }} | {{ permission.user.email }}</v-list-item-subtitle>
                  </v-list-item-content>
                  <v-list-item-action>
                    <v-btn icon @click="removePermission(permission.user_id)">
                      <v-icon>mdi-delete</v-icon>
                    </v-btn>
                  </v-list-item-action>
                </v-list-item>
              </v-list>
              <Alert
                v-if="permissions.length === 0"
                type="info"
                title="None Found"
              >No collaborators have been added to this station.</Alert>
              <Alert
                v-if="removeUser.error"
                type="error"
                title="Server Error"
              >{{ removeUser.error }}</Alert>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'
import evt from '@/events'
export default {
  name: 'ManagePermissions',
  data () {
    return {
      loading: false,
      error: null,
      permissions: [],
      userEmail: {
        value: '',
        error: null,
        rules: [
          v => required(v) || 'Email is required',
          v => email(v) || 'Must be a valid email address'
        ]
      },
      addUser: {
        loading: false,
        error: null
      },
      removeUser: {
        loading: false,
        error: null
      }
    }
  },
  computed: {
    station () {
      return this.$parent.$parent.station
    }
  },
  mounted () {
    this.fetchPermissions()
  },
  methods: {
    fetchPermissions () {
      this.loading = true
      this.error = null
      this.$http.restricted.get(`/stations/${this.$route.params.stationId}/permissions`)
        .then(response => {
          this.permissions = response.data
        })
        .catch(error => {
          console.error('Error fetching permissions:', error)
          this.error = error.response.data.message
        })
        .finally(() => {
          this.loading = false
        })
    },
    addPermission () {
      this.addUser.error = null

      if (!this.$refs.form.validate()) return

      this.addUser.loading = true
      this.$http.restricted.post(`/stations/${this.$route.params.stationId}/permissions`, {
        userEmail: this.userEmail.value
      })
        .then(() => {
          this.clearForm()
          this.fetchPermissions()
          evt.$emit('notify', 'success', 'User added to station')
        })
        .catch(error => {
          console.error('Error adding permission:', error)
          this.addUser.error = error.response.data.message
        })
        .finally(() => {
          this.addUser.loading = false
        })
    },
    removePermission (userId) {
      this.removeUser.loading = true
      this.removeUser.error = null
      this.$http.restricted.delete(`/stations/${this.$route.params.stationId}/permissions/${userId}`)
        .then(() => {
          this.fetchPermissions()
          evt.$emit('notify', 'success', 'User removed from station')
        })
        .catch(error => {
          console.error('Error removing permission:', error)
          this.removeUser.error = error.response.data.message
        })
        .finally(() => {
          this.removeUser.loading = false
        })
    },
    clearForm () {
      this.userEmail.value = ''
      this.$refs.form && this.$refs.form.resetValidation()
    }
  }
}
</script>
