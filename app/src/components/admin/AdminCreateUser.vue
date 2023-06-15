<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-toolbar flat :color="options.color">
        <v-toolbar-title class="text-h5">
          Create User
        </v-toolbar-title>
      </v-toolbar>

      <v-form ref="form" @submit.prevent="submit" :disabled="loading">
        <v-card-text class="mt-4 mb-0">
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Name"
            required
            outlined
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="email.value"
            :rules="email.rules"
            label="Email Address"
            required
            outlined
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="affiliation.code.value"
            :rules="affiliation.code.rules"
            label="Affiliation Abbreviation"
            hint="e.g. MADEP"
            counter
            outlined
            maxlength="32"
            validate-on-blur
          ></v-text-field>
          <v-text-field
            v-model="affiliation.name.value"
            :rules="affiliation.name.rules"
            label="Affiliation Full Name"
            hint="e.g. MA Dept of Environmental Protection"
            counter
            outlined
            maxlength="128"
            validate-on-blur
          ></v-text-field>
          <v-checkbox
            v-model="admin.value"
            label="Add to Admin Group"
            hide-details
          ></v-checkbox>
          <v-checkbox
            v-model="annotator.value"
            label="Add to Annotators"
            hide-details
          ></v-checkbox>

          <Alert type="error" title="Server Error" v-if="error" class="mb-0 mt-4">{{ error }}</Alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-text v-if="request">
          <v-btn
            color="warning"
            outlined
            block
            @click="skipRequest"
            class="mb-4"
          >
            <v-icon left>mdi-debug-step-over</v-icon>
            Skip Request
          </v-btn>
          <v-btn
            color="error"
            outlined
            block
            @click="confirmDeleteRequest"
          >
            <v-icon left>mdi-delete</v-icon>
            Delete Request
          </v-btn>
        </v-card-text>

        <v-divider v-if="request"></v-divider>

        <v-card-actions class="px-4 py-4">
          <v-btn
            type="submit"
            color="primary"
            class="mr-4"
            :loading="loading"
            :disabled="loading"
          >submit</v-btn>
          <v-btn
            text
            @click="clear"
            :disabled="loading"
          >clear</v-btn>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click.native="close"
          >close</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
    <ConfirmDialog ref="confirmDeleteRequest">
      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="font-weight-bold body-1">Are you sure?</div>
        <div>
          This request will be permanently deleted. This action cannot be undone.
        </div>
      </v-alert>
    </ConfirmDialog>
  </v-dialog>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'

import ConfirmDialog from '@/components/ConfirmDialog'
import evt from '@/events'

export default {
  name: 'AdminCreateUser',
  components: { ConfirmDialog },
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      options: {
        color: 'grey lighten-2',
        width: 600,
        zIndex: 5000
      },
      loading: false,
      error: null,
      name: {
        value: '',
        rules: [
          v => required(v) || 'Name is required'
        ]
      },
      email: {
        value: '',
        rules: [
          v => required(v) || 'Email is required',
          v => email(v) || 'Must be a valid email address'
        ]
      },
      affiliation: {
        name: {
          value: '',
          rules: [
            v => !!v || 'Full affiliation name is required',
            v => (!!v && v.trim().length >= 4) || 'Full affiliation name must be at least 4 characters',
            v => (!!v && v.length <= 128) || 'Full affiliation name cannot exceed 128 characters'
          ]
        },
        code: {
          value: '',
          rules: [
            v => !!v || 'Abbreviated affiliation is required',
            v => (!!v && v.trim().length >= 2) || 'Abbreviated affiliation must be at least 2 characters',
            v => (!!v && v.length <= 32) || 'Abbreviated affiliation cannot exceed 32 characters'
          ]
        }
      },
      admin: {
        value: false
      },
      annotator: {
        value: false
      },
      request: null
    }
  },
  methods: {
    async open (request) {
      this.dialog = true

      this.clear()
      if (request) {
        this.name.value = request.name
        this.email.value = request.email
        this.affiliation.code.value = request.affiliation_code
        this.affiliation.name.value = request.affiliation_name
        this.request = request
      }

      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true
      const payload = {
        name: this.name.value,
        email: this.email.value,
        affiliation: {
          name: this.affiliation.name.value,
          code: this.affiliation.code.value
        },
        admin: this.admin.value,
        annotator: this.annotator.value
      }

      try {
        const response = await this.$http.admin.post('/users', payload)
        const user = response.data
        if (this.request) {
          await this.$http.admin.put(`/requests/${this.request.id}`, { pending: false })
        }
        this.clear()
        this.resolve(user)
        this.dialog = false
        evt.$emit('notify', 'success', 'User has been created')
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.error = null
      this.$refs.form && this.$refs.form.resetValidation()
      this.name.value = ''
      this.email.value = ''
      this.affiliation.name.value = ''
      this.affiliation.code.value = ''
      this.admin.value = false
      this.annotator.value = false
      this.request = null
    },
    close () {
      this.resolve(false)
      this.dialog = false
    },
    async skipRequest () {
      try {
        await this.$http.admin.put(`/requests/${this.request.id}`, { pending: false })
        this.close()
      } catch (err) {
        this.err = this.$errorMessage(err)
      }
    },
    async confirmDeleteRequest () {
      const ok = await this.$refs.confirmDeleteRequest.open(
        'Confirm Deletion',
        { btnColor: 'error' }
      )
      if (ok) {
        return await this.deleteRequest()
      }
    },
    async deleteRequest () {
      try {
        await this.$http.admin.delete(`/requests/${this.request.id}`)
        this.close()
      } catch (err) {
        this.err = this.$errorMessage(err)
      }
    }
  }
}
</script>
