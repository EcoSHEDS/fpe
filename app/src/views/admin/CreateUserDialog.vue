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
            maxlength="16"
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
          ></v-checkbox>

          <v-alert
            type="error"
            text
            colored-border
            border="left"
            class="body-2 mb-0"
            v-if="error"
          >
            <div class="body-1 font-weight-bold">Server Error</div>
            <div>{{ error }}</div>
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

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
  </v-dialog>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'

export default {
  name: 'CreateUserDialog',
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
            v => (!!v && v.length <= 16) || 'Abbreviated affiliation cannot exceed 16 characters'
          ]
        }
      },
      admin: {
        value: false
      }
    }
  },
  methods: {
    async open (id) {
      this.dialog = true

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
        admin: this.admin.value,
        affiliation: {
          name: this.affiliation.name.value,
          code: this.affiliation.code.value
        }
      }

      try {
        const response = await this.$http.admin.post('/users', payload)
        const user = response.data
        this.clear()
        this.resolve(user)
        this.dialog = false
      } catch (err) {
        console.error(err)
        this.err = err.toString() || 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.error = null
      this.$refs.form.resetValidation()
      this.name.value = ''
      this.email.value = ''
      this.affiliation.name.value = ''
      this.affiliation.code.value = ''
      this.admin.value = false
    },
    close () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
