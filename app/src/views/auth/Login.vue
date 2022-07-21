<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">Log In</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="pt-8 pb-4 body-1 black--text">
        <v-text-field
          v-model="email.value"
          :rules="email.rules"
          label="Email Address"
          required
          outlined
          validate-on-blur
        ></v-text-field>
        <v-text-field
          v-model="password.value"
          :rules="password.rules"
          label="Password"
          required
          outlined
          validate-on-blur
          type="password"
        ></v-text-field>

        <div>
          <router-link :to="{ name: 'resetPassword' }">Forgot your password?</router-link><br>
          <router-link :to="{ name: 'request' }">Don't have an account?</router-link>
        </div>

        <Alert type="error" title="Login Failed" v-if="error" class="mb-0 mt-4">
          <div>{{ error }}</div>

          <v-btn
            color="info"
            block
            large
            :loading="resend.loading"
            :disabled="resend.success"
            @click="resendPassword"
            class="mt-4"
            v-if="resend.required"
          ><v-icon left>mdi-lock-outline</v-icon> Request New Temporary Password</v-btn>
        </Alert>

        <Alert type="success" title="New Temporary Password Requested" v-if="resend.success" class="mb-0 mt-4">
          <p>
            We will send you a new password in the next 1-2 business days.
          </p>
          <p class="mb-0">
            If you do not receive an email in the next couple days, please check your spam folder.
          </p>
        </Alert>
        <Alert type="error" title="Failed to Request New Temporary Password" v-else-if="resend.error" class="mb-0 mt-4">{{ resend.error }}</Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="resend.required"
        >submit</v-btn>
        <v-btn text @click="clear" :disabled="loading">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$router.push({ name: 'home' })">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { required, email } from 'vuelidate/lib/validators'

import evt from '@/events'

export default {
  name: 'Login',
  data () {
    return {
      loading: false,
      error: null,
      resend: {
        success: false,
        expired: false,
        loading: false,
        error: null
      },
      email: {
        value: '',
        rules: [
          v => required(v) || 'Email is required',
          v => email(v) || 'Email must be a valid email address'
        ]
      },
      password: {
        value: '',
        rules: [
          v => required(v) || 'Password is required'
        ]
      }
    }
  },
  methods: {
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true
      try {
        const user = await this.$Amplify.Auth.signIn(this.email.value, this.password.value)

        switch (user.challengeName) {
          case 'NEW_PASSWORD_REQUIRED':
            return this.$router.push({
              name: 'setup',
              params: {
                user,
                email: this.email.value
              }
            })
        }

        const redirect = this.$route.query.redirect
          ? { path: this.$route.query.redirect }
          : { name: 'manage' }

        return evt.$emit('authState', {
          state: 'signIn',
          redirect
        })
      } catch (err) {
        switch (err.code) {
          case 'UserNotConfirmedException':
            this.$router.push({ name: 'signupConfirm', params: { email: this.email.value } })
            break
          case 'PasswordResetRequiredException':
            this.$router.push({ name: 'resetPassword', params: { email: this.email.value } })
            break
          case 'NotAuthorizedException':
            if (err.message.startsWith('Temporary password has expired')) {
              this.resend.required = true
              this.error = 'Temporary password has expired. Please click the button below to request a new password.'
            } else {
              this.error = this.$errorMessage(err)
            }
            break
          default:
            this.error = this.$errorMessage(err)
        }
        return
      } finally {
        this.loading = false
      }
    },
    async resendPassword () {
      this.resend.success = false
      this.resend.error = null

      if (!this.email.value) {
        this.resend.error = 'Email is required'
        return
      }

      const payload = {
        email: this.email.value,
        resend: true
      }

      this.resend.loading = true
      try {
        await this.$http.public.post('/requests', payload)
        this.resend.success = true
      } catch (err) {
        console.error(err)
        this.resend.error = this.$errorMessage(err)
      } finally {
        this.resend.loading = false
      }
    },
    clear () {
      this.loading = false
      this.error = null
      this.$refs.form.resetValidation()

      this.resend.required = false
      this.resend.loading = false
      this.resend.error = null

      this.email.value = ''
      this.password.value = ''
    }
  }
}
</script>
