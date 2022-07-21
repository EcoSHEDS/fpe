<template>
  <v-btn
    color="primary"
    outlined
    @click="$emit('click')"
    class="ml-4"
    small
    rounded
  >
    <v-icon small left v-if="!loading">mdi-refresh</v-icon>
    <v-progress-circular
      indeterminate
      size="14"
      width="2"
      class="mr-2"
      v-else
    ></v-progress-circular>
    Refresh
  </v-btn>
</template>

<script>
export default {
  name: 'RefreshButton',
  props: ['loading']
}
</script>

<style>

</style>
