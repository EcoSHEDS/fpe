<template>
  <v-card elevation="4">
    <v-toolbar color="grey lighten-3" elevation="0">
      <span class="text-h6">Logged Out</span>
      <v-spacer></v-spacer>
      <v-btn icon small class="mr-0" @click="$router.push({ name: 'home' })">
        <v-icon>mdi-close</v-icon>
      </v-btn>
    </v-toolbar>

    <v-card-text class="body-1 py-8">
      <v-alert
        type="success"
        text
        colored-border
        border="left"
        class="body-2 mb-0"
      >
        <div class="body-1 font-weight-bold">You have been logged out.</div>
        <div>This window will automatically close in {{ count }} seconds...</div>
      </v-alert>
    </v-card-text>

    <v-divider></v-divider>

    <v-card-actions class="mx-2 py-4">
      <v-spacer></v-spacer>
      <v-btn text @click="$router.push({ name: 'home' })">close</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script>
export default {
  name: 'Logout',
  data () {
    return {
      timeout: null,
      count: 3
    }
  },
  created () {
    this.countDownTimer()
  },
  beforeDestroy () {
    this.timeout && clearTimeout(this.timeout)
  },
  methods: {
    countDownTimer () {
      if (this.count > 0) {
        this.timeout = setTimeout(() => {
          this.count -= 1
          this.countDownTimer()
        }, 1000)
      } else {
        this.$router.push({ name: 'home' })
      }
    }
  }
}
</script>
