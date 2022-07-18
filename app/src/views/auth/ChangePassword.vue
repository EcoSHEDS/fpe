<template>
  <v-card elevation="4">
    <v-toolbar flat dense color="grey lighten-3">
      <span class="text-h5">Change Password</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="pt-8 pb-0">
        <v-text-field
          v-model="oldPassword.value"
          :rules="oldPassword.rules"
          label="Current Password"
          required
          outlined
          validate-on-blur
          type="password"
        ></v-text-field>
        <v-text-field
          v-model="newPassword.value"
          :rules="newPassword.rules"
          label="New Password"
          required
          outlined
          validate-on-blur
          type="password"
        ></v-text-field>
        <v-text-field
          v-model="repeatPassword.value"
          :rules="repeatPassword.rules"
          label="Confirm New Password"
          required
          outlined
          validate-on-blur
          type="password"
          class="mb-0"
        ></v-text-field>

        <v-alert
          type="error"
          text
          colored-border
          border="left"
          class="body-2 mb-0"
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
          class="body-2 mb-0"
          :value="success"
        >
          <div class="body-1 font-weight-bold">New Password Saved</div>
          <div>Redirecting back to <router-link :to="{ name: 'account' }">Account Settings</router-link>...</div>
        </v-alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          :loading="loading"
          :disabled="loading"
          type="submit"
          class="mr-4"
          color="primary"
        >submit</v-btn>
        <v-btn text @click="clear" :disabled="loading">clear</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="$router.push({ name: 'account' })">close</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import { required, minLength, maxLength } from 'vuelidate/lib/validators'
import { passwordStrength } from '@/lib/validators'
import evt from '@/events'

export default {
  name: 'ChangePassword',
  data () {
    return {
      loading: false,
      success: false,
      error: null,
      oldPassword: {
        value: '',
        rules: [
          v => required(v) || 'Current password is required'
        ]
      },
      newPassword: {
        value: '',
        rules: [
          v => required(v) || 'New password is required',
          v => minLength(8)(v) || 'Must be at least 8 characters',
          v => maxLength(32)(v) || 'Cannot be more than 32 characters',
          v => passwordStrength(v) || 'Must contain at least one lowercase letter, one uppercase letter and one number'
        ]
      },
      repeatPassword: {
        value: '',
        rules: [
          v => (v === this.newPassword.value) || 'Passwords do not match'
        ]
      }
    }
  },
  methods: {
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      try {
        const user = await this.$Amplify.Auth.currentAuthenticatedUser()
        await this.$Amplify.Auth.changePassword(
          user,
          this.oldPassword.value,
          this.newPassword.value
        )
        this.success = true
        evt.$emit('authState', {
          state: 'signIn',
          redirect: {
            name: 'account',
            query: {
              passwordChanged: true
            }
          }
        })
        this.clear()
      } catch (err) {
        console.error(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading = false
      }
    },
    clear () {
      this.loading = false
      this.success = false
      this.error = null

      this.$refs.form.resetValidation()

      this.newPassword.value = ''
      this.oldPassword.value = ''
      this.repeatPassword.value = ''
    }
  }
}
</script>
