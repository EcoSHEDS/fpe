<template>
  <v-card elevation="4">
    <v-toolbar color="grey lighten-3" elevation="0">
      <span class="text-h6">Sign Up</span>
      <v-spacer></v-spacer>
      <v-btn icon small class="mr-0" @click="$router.push({ name: 'home' })">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text class="body-1 pt-4 black--text">
      <p>
        Sign up for an account to upload your streamflow photos and data.
      </p>
      <p>
        Your name and email will be kept private, and will not be publicly displayed. We may use your email to contact you if we have questions about your photos or data, but we will not share it with any third party.
      </p>
      <p>
        An account is <strong>not required</strong> to view photos and data through the Photo Explorer. It is only required to upload.
      </p>
      <v-form @submit.prevent="submit" @keyup.native.enter="submit">
        <v-text-field
          v-model="email"
          :error-messages="emailErrors"
          label="Email Address"
          required
        ></v-text-field>
        <v-text-field
          v-model="name"
          :error-messages="nameErrors"
          label="Name"
          required
        ></v-text-field>
        <v-text-field
          v-model="password"
          :error-messages="passwordErrors"
          label="Password"
          required
          type="password"
        ></v-text-field>
        <v-text-field
          v-model="repeatPassword"
          :error-messages="repeatPasswordErrors"
          label="Confirm Password"
          required
          type="password"
        ></v-text-field>
      </v-form>

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
      <v-btn text @click="$router.push({ name: 'home' })">cancel</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
import { validationMixin } from 'vuelidate'
import { required, minLength, maxLength, email, sameAs } from 'vuelidate/lib/validators'

import evt from '@/events'
import { passwordStrength } from '@/lib/validators'

export default {
  name: 'SignUp',
  mixins: [validationMixin],
  validations: {
    name: { required },
    email: { required, email },
    password: {
      required,
      minLength: minLength(8),
      maxLength: maxLength(32),
      passwordStrength
    },
    repeatPassword: { sameAsPassword: sameAs('password') }
  },
  data () {
    return {
      submitStatus: 'READY',
      serverError: '',
      name: '',
      email: '',
      password: '',
      repeatPassword: ''
    }
  },
  computed: {
    nameErrors () {
      const errors = []
      if (this.submitStatus === 'READY') return errors
      !this.$v.name.required && errors.push('Name is required.')
      return errors
    },
    emailErrors () {
      const errors = []
      if (this.submitStatus === 'READY') return errors
      !this.$v.email.email && errors.push('Must be valid e-mail')
      !this.$v.email.required && errors.push('E-mail is required')
      return errors
    },
    passwordErrors () {
      const errors = []
      if (this.submitStatus === 'READY') return errors
      !this.$v.password.required && errors.push('Password is required')
      !this.$v.password.minLength && errors.push('Must be at least 8 characters')
      !this.$v.password.maxLength && errors.push('Cannot be more than 32 characters')
      !this.$v.password.passwordStrength && errors.push('Must contain at least one lowercase letter, one uppercase letter and one number.')
      return errors
    },
    repeatPasswordErrors () {
      const errors = []
      if (this.submitStatus === 'READY') return errors
      !this.$v.repeatPassword.sameAsPassword && errors.push('Passwords do not match')
      return errors
    }
  },
  methods: {
    async submit () {
      this.$v.$touch()
      this.serverError = null

      if (this.$v.$invalid) {
        this.submitStatus = 'ERROR'
        return
      }
      this.submitStatus = 'PENDING'
      const props = {
        username: this.email,
        password: this.password,
        attributes: {
          email: this.email,
          name: this.name
        }
      }

      try {
        const response = await this.$Amplify.Auth.signUp(props)
        response.user.password = props.password
        evt.$emit('localUser', response.user)
        if (response.userConfirmed === false) {
          return evt.$emit('authState', {
            state: 'confirmSignUp'
          })
        }
        return evt.$emit('authState', {
          state: 'signIn',
          redirect: {
            name: 'login'
          }
        })
      } catch (err) {
        this.setError(err)
      }
    },
    setError (e) {
      this.submitStatus = 'ERROR'
      this.serverError = e.message || e
    },
    clear () {
      this.$v.$reset()
      this.name = ''
      this.email = ''
      this.password = ''
      this.repeatPassword = ''
      this.submitStatus = 'READY'
    }
  }
}
</script>
