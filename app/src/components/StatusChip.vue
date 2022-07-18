<template>
  <v-chip small outlined :color="color" class="font-weight-bold">{{ status }}</v-chip>
</template>

<script>
export default {
  name: 'StatusChip',
  props: ['status'],
  computed: {
    color () {
      const colors = {
        DONE: 'success',
        QUEUED: 'primary',
        CREATED: 'primary',
        UPLOADING: 'warning',
        FAILED: 'error',
        PROCESSING: 'warning'
      }
      return colors[this.status] || 'primary'
    }
  }
}
</script>

<style>

</style>
