<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">Request Account</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading || success">
      <v-card-text class="pt-4 body-1 black--text">
        <p>
          Use this form to request a new FPE account.
        </p>
        <p>
          An account is only <strong>required to upload</strong> photos and flow data. It is <strong>not required to view</strong> photos on the Photo Explorer.
        </p>
        <p>
          Your name and email will be kept private, and will not be publicly displayed. Your affiliation will be publicly displayed as the owner of your stations.
        </p>
        <p>
          We may use your email to contact you if we have questions about your photos or data, but we will not share it with any third party.
        </p>
        <p class="mb-8">
          If you have questions or trouble requesting an account, contact us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a>.
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
        <p class="secondary--text font-italic body-2">If part of a large agency/organization (e.g., USGS), please include your local branch/office (e.g., EESC) to differentiate your photos from others in your agency.</p>
        <v-text-field
          v-model="affiliationName.value"
          :rules="affiliationName.rules"
          label="Affiliation (Full Name)"
          counter
          outlined
          maxlength="128"
          hint="Full name of your organization (e.g. U.S. Geological Survey, Eastern Ecological Science Center)."
          validate-on-blur
        ></v-text-field>
        <v-text-field
          v-model="affiliationCode.value"
          :rules="affiliationCode.rules"
          label="Affiliation (Abbreviation)"
          counter
          outlined
          maxlength="32"
          hint="Short abbreviation for your organization (e.g. USGS EESC)."
          validate-on-blur
        ></v-text-field>
        <v-textarea
          v-model="description.value"
          :rules="description.rules"
          outlined
          label="Briefly tell us about your photos (where, how many cameras, ...)"
        ></v-textarea>

        <div>
          <router-link :to="{ name: 'login' }">
            Already have an account?
          </router-link>
        </div>

        <Alert type="error" title="Server Error" v-if="error" class="mb-0 mt-4">{{ error }}</Alert>
        <Alert type="success" title="Account Request Submitted" v-else-if="success" class="mb-0 mt-4">
          <p>
            We will create your account in the next 1-2 business days and send you an email with a temporary password.
          </p>
          <p>
            If you don't get an email in the next few days, check your spam folder.
          </p>
          <p class="mb-0">
            Until then, you can <router-link :to="{ name: 'explorer' }">explore existing flow photos</router-link>.
          </p>
        </Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="success"
        >submit</v-btn>
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
  name: 'Request',
  data () {
    return {
      success: false,
      loading: false,
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
          v => (!!v && v.length <= 32) || 'Abbreviated affiliation cannot exceed 32 characters'
        ]
      },
      description: {
        value: '',
        rules: [
          v => !!v || 'Description is required'
        ]
      }
    }
  },
  methods: {
    async submit () {
      this.success = false
      this.error = null

      if (!this.$refs.form.validate()) return

      const payload = {
        name: this.name.value,
        email: this.email.value,
        affiliation_name: this.affiliationName.value,
        affiliation_code: this.affiliationCode.value,
        description: this.description.value
      }

      this.loading = true
      try {
        await this.$http.public.post('/requests', payload)
        this.success = true
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.success = false
      this.loading = false
      this.error = null
      this.$refs.form.resetValidation()

      this.name.value = ''
      this.email.value = ''
      this.affiliationName.value = ''
      this.affiliationCode.value = ''
      this.description.value = ''
    }
  }
}
</script>
