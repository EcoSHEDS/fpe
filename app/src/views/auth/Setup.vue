<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">Complete Account Setup</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="py-4 body-1 black--text">
        <p class="mb-8">
          Complete the form below to finish setting up your account.
        </p>
        <v-text-field
          v-model="email.value"
          label="Email Address"
          disabled
          outlined
        ></v-text-field>

        <div v-if="nameRequired">
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Full Name"
            required
            outlined
            validate-on-blur
          ></v-text-field>
        </div>

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
          type="password"
        ></v-text-field>

        <Alert type="error" title="Account Setup Failed" v-if="error" class="mb-0 mt-4">{{ error }}</Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
        >submit</v-btn>
        <v-btn text @click="clear" :disabled="loading">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$router.push({ name: 'home' })">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { required, minLength, maxLength } from 'vuelidate/lib/validators'
import { passwordStrength } from '@/lib/validators'

import evt from '@/events'

export default {
  name: 'Setup',
  data () {
    return {
      loading: false,
      error: null,
      user: null,
      email: {
        value: '',
        rules: []
      },
      nameRequired: false,
      name: {
        value: '',
        rules: [
          v => (this.nameRequired && required(v)) || 'Name is required'
        ]
      },
      password: {
        value: '',
        rules: [
          v => required(v) || 'Password is required',
          v => minLength(8)(v) || 'Must be at least 8 characters',
          v => maxLength(32)(v) || 'Cannot be more than 32 characters',
          v => passwordStrength(v) || 'Must contain at least one lowercase letter, one uppercase letter and one number'
        ]
      },
      repeatPassword: {
        value: '',
        rules: [
          v => required(v) || 'Password is required',
          v => (v === this.password.value) || 'Passwords do not match'
        ]
      }
    }
  },
  mounted () {
    if (!this.$route.params.user) {
      this.$router.push({ name: 'login' })
    }
    this.user = this.$route.params.user
    this.email.value = this.$route.params.email
    if (this.user.challengeParam &&
        this.user.challengeParam.requiredAttributes &&
        this.user.challengeParam.requiredAttributes.includes('name')) {
      this.nameRequired = true
    }
  },
  methods: {
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      const attributes = {}
      if (this.nameRequired) {
        attributes.name = this.name.value
      }

      this.loading = true
      try {
        await this.$Amplify.Auth.completeNewPassword(this.user, this.password.value, attributes)

        // evt.$emit('notify', 'success', `Welcome, ${user.attributes.name}!`)
        return evt.$emit('authState', {
          state: 'signIn',
          redirect: { name: 'manage' }
        })
      } catch (err) {
        switch (err.code) {
          default:
            this.error = this.$errorMessage(err)
        }
        return
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.loading = false
      this.error = null

      this.$refs.form.resetValidation()

      this.name.value = ''
      this.password.value = ''
      this.repeatPassword.value = ''
    }
  }
}
</script>
