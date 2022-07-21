<template>
  <v-card elevation="4">
    <v-toolbar dense flat color="grey lighten-3">
      <span class="text-h5">Change Password</span>
    </v-toolbar>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="py-4 body-1 black--text">
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
          type="password"
        ></v-text-field>

        <Alert type="error" title="Server Error" v-if="error">{{ error }}</Alert>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="mx-2 py-4">
        <v-btn
          :loading="loading"
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
          v => required(v) || 'New password is required',
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
        evt.$emit('notify', 'success', 'Password has been changed')
        evt.$emit('authState', { state: 'signInRefresh' })
        this.$router.push({ name: 'account' })
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

      this.newPassword.value = ''
      this.oldPassword.value = ''
      this.repeatPassword.value = ''
    }
  }
}
</script>
