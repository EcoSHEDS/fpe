<template>
  <v-dialog
    v-model="dialog"
    scrollable
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="close"
  >
    <v-card>
      <v-toolbar flat :color="options.color">
        <v-toolbar-title class="text-h5">
          Edit User
        </v-toolbar-title>
      </v-toolbar>
      <v-tabs
        v-model="tab"
        color="primary"
        grow
      >
        <v-tab>
          Account
        </v-tab>
        <v-tab>
          Affiliation
        </v-tab>

        <v-tab-item>
          <div v-if="loading.init" class="text-h5 text-center py-8">
            Loading...
          </div>
          <v-card v-else-if="user">
            <v-simple-table>
              <tbody>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    ID
                  </td>
                  <td class="font-weight-bold">{{ user.id }}</td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Created
                  </td>
                  <td class="font-weight-bold">{{ user.created_at | formatTimestamp('local', 'DD ttt') }}</td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Updated
                  </td>
                  <td class="font-weight-bold">{{ user.updated_at | formatTimestamp('local', 'DD ttt') }}</td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Name
                  </td>
                  <td class="font-weight-bold">{{ user.attributes.name }}</td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Email
                  </td>
                  <td class="font-weight-bold">
                    {{ user.attributes.email }}
                  </td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Enabled
                  </td>
                  <td class="font-weight-bold">
                    <v-icon v-if="user.enabled" color="primary">mdi-check-circle</v-icon>
                    <v-icon v-else color="gray">mdi-close-circle</v-icon>
                  </td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Admin
                  </td>
                  <td class="font-weight-bold">
                    <v-icon v-if="user.is_admin" color="primary">mdi-check-circle</v-icon>
                    <v-icon v-else color="gray">mdi-close-circle</v-icon>
                  </td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Annotator
                  </td>
                  <td class="font-weight-bold">
                    <v-icon v-if="user.affiliation && user.affiliation.annotator" color="primary">mdi-check-circle</v-icon>
                    <v-icon v-else color="gray">mdi-close-circle</v-icon>
                  </td>
                </tr>
                <tr>
                  <td
                    class="text-right"
                    style="width:140px">
                    Status
                  </td>
                  <td class="font-weight-bold">
                    <div class="d-flex align-center">
                      <v-chip
                        v-if="user.status==='CONFIRMED'"
                        small
                        label
                        color="gray"
                      >
                        {{ user.status }}
                      </v-chip>
                      <v-chip
                        v-else
                        small
                        label
                        color="warning"
                      >
                        {{ user.status }}
                      </v-chip>
                      <v-spacer></v-spacer>
                    </div>
                  </td>
                </tr>
              </tbody>
            </v-simple-table>

            <v-divider class="mb-0"></v-divider>

            <v-card-text>
              <div v-if="user.status === 'FORCE_CHANGE_PASSWORD'">
                <v-btn
                  color="primary"
                  block
                  outlined
                  :loading="loading.resendPassword"
                  @click="resendPassword"
                >
                  <v-icon left>mdi-lock-outline</v-icon>Reset Temporary Password
                </v-btn>

                <div class="my-4"></div>
              </div>
              <div v-else>
                <v-btn
                  color="primary"
                  block
                  outlined
                  :loading="loading.resetPassword"
                  @click="resetPassword"
                >
                  <v-icon left>mdi-refresh</v-icon>Reset Password
                </v-btn>

                <div class="my-4"></div>
              </div>

              <v-btn
                v-if="!user.is_admin"
                color="success"
                block
                outlined
                :loading="loading.admin"
                @click="setAdminGroup(true)"
              >
                <v-icon left>mdi-badge-account</v-icon> Add to Admins
              </v-btn>
              <v-btn
                v-else
                color="warning"
                block
                outlined
                :loading="loading.admin"
                @click="setAdminGroup(false)"
              >
                <v-icon left>mdi-close</v-icon> Remove from Admins
              </v-btn>

              <div class="my-4"></div>

              <v-btn
                v-if="!(user.affiliation && user.affiliation.annotator)"
                color="success"
                block
                outlined
                :loading="loading.annotator"
                @click="setAnnotator(true)"
              >
                <v-icon left>mdi-pencil-box-outline</v-icon> Add to Annotators
              </v-btn>
              <v-btn
                v-else
                color="warning"
                block
                outlined
                :loading="loading.annotator"
                @click="setAnnotator(false)"
              >
                <v-icon left>mdi-close</v-icon> Remove from Annotators
              </v-btn>

              <div class="my-4"></div>

              <v-btn
                v-if="!user.enabled"
                color="success"
                block
                outlined
                :loading="loading.enabled"
                @click="setEnabled(true)"
              >
                <v-icon left>mdi-check</v-icon> Enable User
              </v-btn>
              <v-btn
                v-else
                color="error"
                block
                outlined
                :loading="loading.enabled"
                @click="setEnabled(false)"
              >
                <v-icon left>mdi-close</v-icon> Disable User
              </v-btn>

              <div class="my-4"></div>

              <v-btn
                color="error"
                outlined
                block
                @click="confirmDelete"
                :loading="loading.delete"
              >
                <v-icon left>mdi-delete</v-icon>
                Delete User
              </v-btn>
            </v-card-text>
          </v-card>
        </v-tab-item>
        <v-tab-item>
          <div v-if="loading.init" class="text-h5 text-center py-8">
            Loading...
          </div>
          <v-card v-else-if="affiliation">
            <v-card-text>
              <v-form :disabled="loading.affiliation">
                <v-text-field
                  v-model="affiliation.code.value"
                  label="Abbreviation"
                  counter
                  maxlength="32"
                  hint="e.g. MADEP"
                  outlined
                  dense
                  validate-on-blur
                  class="mb-4"
                ></v-text-field>
                <v-text-field
                  v-model="affiliation.name.value"
                  label="Full Name"
                  counter
                  outlined
                  maxlength="128"
                  hint="e.g. MA Dept of Environmental Protection"
                  dense
                  validate-on-blur
                  class="mb-4"
                ></v-text-field>
                <v-btn
                  color="primary"
                  :loading="loading.affiliation"
                  :disabled="loading.affiliation"
                  @click="changeAffiliation"
                >Update</v-btn>
              </v-form>
            </v-card-text>
          </v-card>
        </v-tab-item>
      </v-tabs>
      <v-divider></v-divider>

      <v-card-actions class="px-4 py-4">
        <v-spacer></v-spacer>
        <v-btn
          text
          @click.native="close"
        >close</v-btn>
      </v-card-actions>
    </v-card>

    <ConfirmDialog ref="confirmDelete">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          This user will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import ConfirmDialog from '@/components/ConfirmDialog'
import evt from '@/events'
export default {
  name: 'AdminEditUser',
  components: { ConfirmDialog },
  data () {
    return {
      tab: 0,
      dialog: false,
      resolve: null,
      reject: null,
      options: {
        color: 'grey lighten-2',
        width: 600,
        zIndex: 5000
      },
      id: null,
      user: null,
      groups: [],
      loading: {
        init: false,
        // confirm: false,
        enabled: false,
        admin: false,
        annotator: false,
        delete: false,
        affiliation: false,
        resetPassword: false,
        resendPassword: false
      },
      affiliation: {
        name: {
          value: ''
        },
        code: {
          value: ''
        }
      },
      modified: false,
      error: null
    }
  },
  methods: {
    async open (id) {
      this.dialog = true
      this.id = id
      this.modified = false

      this.init()

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    close () {
      this.resolve(this.modified)
      this.dialog = false
    },
    async init () {
      this.loading.init = true

      try {
        await this.refresh()
      } catch (err) {
        console.log(err)
        this.error = err
      } finally {
        this.loading.init = false
      }
    },
    async refresh () {
      this.error = null

      if (!this.id) {
        this.error = 'Missing User ID'
        return
      }

      this.user = await this.getUser(this.id)
      if (this.user.affiliation) {
        this.affiliation.name.value = this.user.affiliation.affiliation_name
        this.affiliation.code.value = this.user.affiliation.affiliation_code
      } else {
        this.affiliation.name.value = ''
        this.affiliation.name.value = ''
      }

      // this.loading.confirm = false
      this.loading.enabled = false
      this.loading.admin = false
    },
    async getUser (id) {
      const response = await this.$http.admin.get(`/users/${id}`)
      const user = response.data

      user.attributes.email_verified = user.attributes.email_verified === 'true'

      return user
    },
    async setAdminGroup (value) {
      this.loading.admin = true
      this.modified = true
      const action = value ? 'addToAdmin' : 'removeFromAdmin'
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action })
        evt.$emit('notify', 'success', 'User has been updated')
        this.refresh()
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.admin = false
      }
    },
    async setAnnotator (value) {
      this.loading.annotator = true
      this.modified = true
      const action = value ? 'addToAnnotator' : 'removeFromAnnotator'
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action })
        evt.$emit('notify', 'success', 'User has been updated')
        this.refresh()
      } catch (err) {
        console.error(err)
        evt.$emit('notify', 'error', 'Failed to update user')
        this.error = err
      } finally {
        this.loading.annotator = false
      }
    },
    async setEnabled (value) {
      this.loading.enabled = true
      this.modified = true
      const action = value ? 'enable' : 'disable'
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action })
        evt.$emit('notify', 'success', 'User has been updated')
        this.refresh()
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.enabled = false
      }
    },
    async resetPassword () {
      this.loading.resetPassword = true
      this.modified = true
      const action = 'resetPassword'
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action })
        evt.$emit('notify', 'success', 'User password has been reset')
        this.refresh()
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.resetPassword = false
      }
    },
    async resendPassword () {
      this.loading.resendPassword = true
      this.modified = true
      const action = 'resendPassword'
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action })
        evt.$emit('notify', 'success', 'Password has been resent')
        this.refresh()
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.resendPassword = false
      }
    },
    async changeAffiliation () {
      this.loading.affiliation = true
      this.modified = true
      const action = 'setAffiliation'
      const payload = {
        id: this.id,
        affiliation: {
          name: this.affiliation.name.value,
          code: this.affiliation.code.value
        }
      }
      try {
        await this.$http.admin.put(`/users/${this.id}`, { action, payload })
        evt.$emit('notify', 'success', 'User affiliation has been updated')
        this.refresh()
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.affiliation = false
      }
    },
    async confirmDelete () {
      const ok = await this.$refs.confirmDelete.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteUser()
      }
    },
    async deleteUser () {
      this.loading.delete = true
      try {
        await this.$http.admin.delete(`/users/${this.id}`)
        evt.$emit('notify', 'success', 'User has been deleted')
        this.resolve(true)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.error = err
      } finally {
        this.loading.delete = false
      }
    }
  }
}
</script>
