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
export default {
  name: 'Auth'
}
</script>

<style>

</style>
