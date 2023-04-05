<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">Account Settings</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="py-4 body-1 black--text">
        <p class="mb-8">
          Note: Email address cannot be changed. Please contact us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a> if you need to change it.
        </p>
        <v-text-field
          v-model="email.value"
          :rules="email.rules"
          label="Email Address"
          required
          disabled
          outlined
        ></v-text-field>
        <v-text-field
          v-model="name.value"
          :rules="name.rules"
          label="Name"
          required
          outlined
        ></v-text-field>

        <v-btn
          color="primary"
          outlined
          block
          :to="{ name: 'changePassword' }"
        >
          <v-icon left>mdi-lock</v-icon> Change Password
        </v-btn>

        <Alert type="error" title="Account Update Failed" class="mb-0 mt-4" v-if="error">{{ error }}</Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="loading"
        >
          submit
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$router.push({ name: 'home' })">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'
import { required } from 'vuelidate/lib/validators'
import evt from '@/events'

export default {
  name: 'Account',
  data () {
    return {
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
        rules: []
      }
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    if (!this.user) {
      return this.$router.push({ name: 'login' })
    }
    this.name.value = this.user.attributes.name
    this.email.value = this.user.attributes.email
  },
  methods: {
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true
      try {
        const user = await this.$Amplify.Auth.currentAuthenticatedUser()
        await this.$Amplify.Auth.updateUserAttributes(user, {
          email: this.email.value,
          name: this.name.value
        })
        evt.$emit('notify', 'success', 'Account has been updated')
        evt.$emit('authState', { state: 'signInRefresh' })
      } catch (err) {
        console.error(err)
        this.error = this.$errorMessage(err)
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.loading = false
      this.error = null
      this.$refs.form.resetValidation()

      this.name.value = ''
      this.email.value = ''
    }
  }
}
</script>
