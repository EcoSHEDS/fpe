<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">My Account</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="body-2 pt-8">
        <v-text-field
          v-model="email.value"
          :rules="email.rules"
          label="Email Address"
          required
          hint="Email cannot be changed, please contact us if you need to change it."
          persistent-hint
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
          class="mb-4"
        >
          <v-icon left>mdi-lock</v-icon> Change Password
        </v-btn>

        <v-alert
          type="success"
          text
          colored-border
          border="left"
          class="body-2 mb-0 mt-8"
          :value="!!$route.query.passwordChanged"
        >
          <div class="font-weight-bold body-1">
            Your password has been changed.
          </div>
        </v-alert>

        <v-alert
          type="error"
          text
          colored-border
          border="left"
          class="body-2 mb-0 mt-8"
          :value="!!error"
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
          :value="success"
        >
          <div class="body-1 font-weight-bold">Update complete</div>
          <div>Changes have been saved to the server</div>
        </v-alert>
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
          save
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
      success: false,
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
      this.success = false

      if (!this.$refs.form.validate()) return

      this.loading = true
      try {
        const user = await this.$Amplify.Auth.currentAuthenticatedUser()
        await this.$Amplify.Auth.updateUserAttributes(user, {
          email: this.email.value,
          name: this.name.value
        })
        await this.$Amplify.Auth.currentAuthenticatedUser({ bypassCache: true })
        this.success = true
        evt.$emit('authState', { state: 'signInRefresh' })
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString()
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
    }
  }
}
</script>
