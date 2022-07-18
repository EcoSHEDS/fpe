<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" lg="8" xl="6">
        <v-alert
          type="error"
          text
          colored-border
          prominent
          border="left"
          class="body-2 mb-0"
        >
          <div class="title">Page Not Found</div>
          <div>Return to <router-link :to="{ name: 'home' }">Home</router-link></div>
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'NotFound'
}
</script>
