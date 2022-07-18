<template>
  <v-card elevation="4">
    <v-toolbar flat dense color="grey lighten-3">
      <span class="text-h5">Password Reset</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="body-1 pt-4 black--text">
        <p>
          Enter your email address to request a password reset.
        </p>
        <v-text-field
          v-model="email.value"
          :rules="email.rules"
          label="Email Address"
          required
          outlined
          validate-on-blur
        ></v-text-field>

        <div v-if="requestSent">
          <v-alert
            type="success"
            text
            colored-border
            border="left"
            class="mt-4 mb-8 body-2"
          >
            <div class="body-1 font-weight-bold">Request submitted</div>
            <div>Check your email for the verification code, and then set a new password.</div>
          </v-alert>

          <v-text-field
            v-model="code.value"
            :rules="code.rules"
            label="Verification Code"
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
          <v-text-field
            v-model="repeatPassword.value"
            :rules="repeatPassword.rules"
            label="Confirm Password"
            required
            outlined
            validate-on-blur
            type="password"
          ></v-text-field>
        </div>

        <v-alert
          type="error"
          text
          colored-border
          border="left"
          class="body-2 mb-0 mt-4"
          :value="!!error"
        >
          <div class="body-1 font-weight-bold">Server Error</div>
          <div>{{error}}</div>
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          @click="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
          :disabled="loading"
        >submit</v-btn>
        <v-btn text @click="clear" :disabled="loading">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text :to="{ name: 'login' }">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { required, minLength, maxLength, email } from 'vuelidate/lib/validators'

import { passwordStrength } from '@/lib/validators'

export default {
  name: 'ResetPassword',
  data () {
    return {
      loading: false,
      error: null,
      requestSent: false,
      email: {
        value: '',
        rules: [
          v => required(v) || 'Email is required',
          v => email(v) || 'Must be a valid email address'
        ]
      },
      code: {
        value: '',
        rules: [
          v => (this.requestSent && required(v)) || 'Code is required'
        ]
      },
      password: {
        value: '',
        rules: [
          v => (this.requestSent && required(v)) || 'Password is required',
          v => minLength(8)(v) || 'Must be at least 8 characters',
          v => maxLength(32)(v) || 'Cannot be more than 32 characters',
          v => passwordStrength(v) || 'Must contain at least one lowercase letter, one uppercase letter and one number'
        ]
      },
      repeatPassword: {
        value: '',
        rules: [
          v => (v === this.password.value) || 'Passwords do not match'
        ]
      }
    }
  },
  methods: {
    async submit () {
      this.error = null
      if (!this.$refs.form.validate()) return

      if (!this.requestSent) {
        return await this.submitRequest()
      } else {
        return await this.submitPassword()
      }
    },
    async submitRequest () {
      this.loading = true
      try {
        await this.$Amplify.Auth.forgotPassword(this.email.value)
        this.requestSent = true
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading = false
      }
    },
    async submitPassword () {
      this.loading = true
      try {
        await this.$Amplify.Auth.forgotPasswordSubmit(
          this.email.value,
          this.code.value,
          this.password.value
        )
        return this.$router.push({
          name: 'login',
          query: { reset: true }
        })
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.loading = false
      this.error = null
      this.$refs.form.resetValidation()

      this.requestSent = false

      this.email.value = ''
      this.code.value = ''
      this.password.value = ''
      this.repeatPassword.value = ''
    }
  }
}
</script>
