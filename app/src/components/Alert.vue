<template>
  <v-alert
    :type="type"
    text
    colored-border
    border="left"
    class="body-2"
    :color="color"
    :value="true"
  >
    <div class="font-weight-bold body-1">{{ title }}</div>
    <slot></slot>
  </v-alert>
</template>

<script>
export default {
  name: 'Alert',
  props: ['type', 'title', 'color']
}
</script>
