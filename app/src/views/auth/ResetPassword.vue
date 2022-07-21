<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">Reset Password</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="reset.loading">
      <v-card-text class="py-4 body-1 black--text">
        <p>
          To reset your password, enter your email and then press the "Request New Verification Code" button below. If you already received a code, you do not need to request a new one.
        </p>
        <v-text-field
          v-model="email.value"
          :rules="email.rules"
          label="Email Address"
          required
          outlined
          validate-on-blur
        ></v-text-field>

        <v-text-field
          v-model="code.value"
          :rules="code.rules"
          label="Verification Code"
          required
          outlined
          validate-on-blur
        ></v-text-field>

        <div class="mb-4">
          <v-btn
            color="primary"
            large
            block
            outlined
            @click="requestCode"
            :loading="request.loading"
          >
            <v-icon left small>mdi-lock-outline</v-icon> Request New Verification Code
          </v-btn>
        </div>

        <Alert type="error" class="body-2 my-4" title="Error Requesting Code" v-if="request.error">
          {{ request.error }}
        </Alert>
        <Alert type="success" title="Request Submitted" class="mt-4 mb-8" v-else-if="request.success">
          Check your email for the verification code, and then set a new password. If you do not see an email, check your spam folder.
        </Alert>

        <p class="mt-8">After entering your verification code, set a new password.</p>

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

        <Alert type="error" class="mb-0 mt-4" title="Password Reset Failed" v-if="reset.error">
          {{ reset.error }}
        </Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="reset.loading"
        >submit</v-btn>
        <v-btn text @click="clear" :disabled="reset.loading">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text :to="{ name: 'login' }">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { required, minLength, maxLength, email } from 'vuelidate/lib/validators'
import { passwordStrength } from '@/lib/validators'
import evt from '@/events'

export default {
  name: 'ResetPassword',
  data () {
    return {
      reset: {
        loading: false,
        error: false
      },
      request: {
        loading: false,
        error: false,
        success: false
      },
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
          v => required(v) || 'Code is required'
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
    this.email.value = this.$route.params.email || ''
  },
  methods: {
    async submit () {
      this.reset.error = null

      if (!this.$refs.form.validate()) return

      this.reset.loading = true
      try {
        await this.$Amplify.Auth.forgotPasswordSubmit(
          this.email.value,
          this.code.value,
          this.password.value
        )
        evt.$emit('notify', 'success', 'Password has been reset. Please log in.')
        return this.$router.push({ name: 'login' })
      } catch (err) {
        console.error(err)
        this.reset.error = this.$errorMessage(err)
      } finally {
        this.reset.loading = false
      }
    },
    async requestCode () {
      if (!this.email.value) {
        this.request.error = 'Email address is required'
        return
      }

      this.request.error = null
      this.request.success = false
      this.request.loading = true
      try {
        await this.$Amplify.Auth.forgotPassword(this.email.value)
        this.request.success = true
      } catch (err) {
        console.error(err)
        if (err.code) {
          switch (err.code) {
            case 'UserNotFoundException':
              this.request.error = 'Email address not found'
              break
            default:
              this.request.error = this.$errorMessage(err)
          }
        }
      } finally {
        this.request.loading = false
      }
    },
    clear () {
      this.request.loading = false
      this.request.error = null
      this.request.success = false

      this.reset.loading = false
      this.reset.error = null

      this.$refs.form.resetValidation()

      this.email.value = ''
      this.code.value = ''
      this.password.value = ''
      this.repeatPassword.value = ''
    }
  }
}
</script>
