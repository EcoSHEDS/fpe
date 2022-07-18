<template>
  <v-card elevation="4">
    <v-toolbar color="grey lighten-3" elevation="0">
      <span class="text-h6">Verify Email</span>
      <v-spacer></v-spacer>
      <v-btn icon small class="mr-0" :to="{ name: 'login' }">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text class="pt-8">
      <v-form @submit.prevent="submit" @keyup.native.enter="submit">
        <v-text-field
          v-model="email"
          :error-messages="emailErrors"
          label="Email Address"
          required
        ></v-text-field>
        <v-text-field
          v-model="code"
          :error-messages="codeErrors"
          label="Verification Code"
          required
          hint="Check your email for the verification code"
          persistent-hint
        ></v-text-field>
      </v-form>

      <div class="mt-4">
        <a href="#" @click.prevent="resend">Can't find your code? Request a new one.</a>
        <v-alert
          type="success"
          text
          colored-border
          border="left"
          class="body-2 mb-0 mt-4"
          :value="resendCode"
        >
          <div class="font-weight-bold body-1">Request submitted, check your email for a new code.</div>
        </v-alert>
      </div>

      <v-alert
        type="error"
        text
        colored-border
        border="left"
        class="body-2 mb-0 mt-4"
        :value="!!serverError"
      >
        <div class="body-1 font-weight-bold">Server Error</div>
        <div>{{serverError}}</div>
      </v-alert>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions class="mx-2 py-4">
      <v-btn @click="submit" color="primary" class="mr-4" :loading="submitStatus === 'PENDING'">submit</v-btn>
      <v-btn text @click="clear">clear</v-btn>
      <v-spacer></v-spacer>
      <v-btn text :to="{ name: 'login' }">cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { required, email } from 'vuelidate/lib/validators'

import evt from '@/events'

export default {
  name: 'SignUp',
  mixins: [validationMixin],
  validations: {
    email: { required, email },
    code: { required }
  },
  data () {
    return {
      submitStatus: 'READY',
      serverError: '',
      resendCode: false,
      email: '',
      code: ''
    }
  },
  computed: {
    emailErrors () {
      const errors = []
      if (this.submitStatus === 'READY') return errors
      !this.$v.email.email && errors.push('Must be valid e-mail')
      !this.$v.email.required && errors.push('E-mail is required')
      return errors
    },
    codeErrors () {
      const errors = []
      if (this.submitStatus === 'READY' || this.submitStatus === 'RESEND') return errors
      !this.$v.code.required && errors.push('Code is required.')
      return errors
    }
  },
  mounted () {
    if (this.$parent.user) {
      this.email = this.$parent.user.username
    }
  },
  methods: {
    submit () {
      this.$v.$touch()
      this.serverError = null
      if (this.$v.$invalid) {
        this.submitStatus = 'ERROR'
      } else {
        this.submitStatus = 'PENDING'
        this.$Amplify.Auth.confirmSignUp(this.email, this.code)
          .then(data => {
            if (data.userConfirmed === false) {
              return evt.$emit('authState', {
                state: 'confirmSignUp'
              })
            } else if (this.$parent.user && this.$parent.user.username && this.$parent.user.password) {
              // auto-sign in using password from Signup form
              return this.$Amplify.Auth
                .signIn(this.$parent.user.username, this.$parent.user.password)
                .then(() => {
                  evt.$emit('authState', {
                    state: 'signIn',
                    redirect: { name: 'manage' }
                  })
                })
            }
            evt.$emit('localUser', { username: this.email })
            return evt.$emit('authState', {
              state: 'signIn',
              redirect: {
                name: 'login',
                query: { verified: true }
              }
            })
          })
          .catch(e => this.setError(e))
      }
    },
    resend () {
      if (this.$v.email.$invalid) {
        this.submitStatus = 'RESEND'
      } else {
        this.$Amplify.Auth.resendSignUp(this.email)
          .then(() => {
            this.resendCode = true
          })
          .catch(e => this.setError(e))
      }
    },
    setError (e) {
      this.submitStatus = 'ERROR'
      this.serverError = this.$Amplify.I18n.get(e.message || e)
    },
    clear () {
      this.$v.$reset()
      this.email = ''
      this.code = ''
      this.submitStatus = 'READY'
      this.serverError = null
    }
  }
}
</script>
