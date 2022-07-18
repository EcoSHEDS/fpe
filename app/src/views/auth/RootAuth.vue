<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" md="6">
        <router-view></router-view>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import evt from '@/events'

export default {
  name: 'Auth',
  data () {
    return {
      user: {
        username: null,
        email: null
      }
    }
  },
  mounted () {
    evt.$on('localUser', this.setLocalUser)
  },
  beforeDestroy () {
    evt.$off('localUser', this.setLocalUser)
  },
  methods: {
    setLocalUser (user) {
      this.user = user
    }
  }
}
</script>

<style>

</style>
