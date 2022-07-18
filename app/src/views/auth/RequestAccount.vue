<template>
  <v-card elevation="4">
    <v-toolbar flat dense color="grey lighten-3">
      <span class="text-h5">Request Account</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading || success">
      <v-card-text class="body-1 pt-4 black--text">
        <p>
          Request an account to upload your streamflow photos and data.
        </p>
        <p>
          An account is <strong>not required</strong> to view photos and data through the Photo Explorer. It is only required to upload.
        </p>
        <p>
          Your name and email will be kept private, and will not be publicly displayed. Your affiliation will be publicly displayed as the owner of your stations.
        </p>
        <p>
          We may use your email to contact you if we have questions about your photos or data, but we will not share it with any third party.
        </p>
        <p class="mb-8">
          If you have questions or trouble requesting an account, contact us at <a href="mailto:gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com">gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com</a>.
        </p>
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
          v-model="affiliationName.value"
          :rules="affiliationName.rules"
          label="Affiliation (Full Name)"
          counter
          outlined
          maxlength="128"
          hint="The full name of your organization (e.g. U.S. Geological Survey or MA Dept of Environmental Protection)."
          validate-on-blur
        ></v-text-field>
        <v-text-field
          v-model="affiliationCode.value"
          :rules="affiliationCode.rules"
          label="Affiliation (Abbreviation)"
          counter
          outlined
          maxlength="16"
          hint="A short abbreviation for your organization (e.g. USGS or MA DEP). Please only use UPPERCASE letters and spaces."
          validate-on-blur
        ></v-text-field>

        <div class="mt-4">
          <router-link :to="{ name: 'login' }">
            Already have an account?
          </router-link>
        </div>

        <v-alert
          type="error"
          text
          colored-border
          border="left"
          class="body-2 mb-0 mt-4"
          v-if="!!error"
        >
          <div class="body-1 font-weight-bold">Server Error</div>
          <div>{{error}}</div>
        </v-alert>

        <v-alert
          type="success"
          text
          colored-border
          border="left"
          class="body-2 mb-0 mt-4"
          v-else-if="success"
        >
          <div class="body-1 font-weight-bold">Account Request Has Been Submitted</div>
          <p>
            We will create your account in the next 1-2 business days and send you an email with your login and password.
          </p>
          <p>
            If you don't get an email in the next few days, check your spam folder then contact us at: <a href="mailto:gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com">gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com</a>
          </p>
          <p class="mb-0">
            Until then, go <router-link :to="{ name: 'explorer' }">explore our current photos</router-link>!
          </p>
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn type="submit" color="primary" class="mr-4" :loading="loading" :disabled="success">submit</v-btn>
        <v-btn text @click="clear" :disabled="success">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$router.push({ name: 'home' })">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { email } from '@/lib/validators'

export default {
  name: 'RequestAccount',
  data () {
    return {
      loading: false,
      success: false,
      status: 'READY',
      error: null,
      name: {
        value: '',
        rules: [
          v => !!v || 'Name is required'
        ]
      },
      email: {
        value: '',
        rules: [
          v => !!v || 'Email is required',
          v => (!!v && email(v)) || 'Must be a valid email address'
        ]
      },
      affiliationName: {
        value: '',
        rules: [
          v => !!v || 'Full affiliation name is required',
          v => (!!v && v.trim().length >= 4) || 'Full affiliation name must be at least 4 characters',
          v => (!!v && v.length <= 128) || 'Full affiliation name cannot exceed 128 characters'
        ]
      },
      affiliationCode: {
        value: '',
        rules: [
          v => !!v || 'Abbreviated affiliation is required',
          v => (!!v && v.trim().length >= 2) || 'Abbreviated affiliation must be at least 2 characters',
          v => (!!v && v.length <= 16) || 'Abbreviated affiliation cannot exceed 16 characters'
        ]
      }
    }
  },
  methods: {
    async submit () {
      this.error = null
      this.success = false

      if (!this.$refs.form.validate()) return

      this.loading = true
      const payload = {
        name: this.name.value,
        email: this.email.value,
        affiliation_name: this.affiliationName.value,
        affiliation_code: this.affiliationCode.value
      }

      try {
        await this.$http.public.post('/accounts', payload)
        this.success = true
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString() || 'Unknown error occurred'
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.success = false
      this.error = null
      this.$refs.form.resetValidation()

      this.name.value = ''
      this.email.value = ''
      this.affiliationName.value = ''
      this.affiliationCode.value = ''
    }
  }
}
</script>
