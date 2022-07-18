<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-toolbar dense flat elevation="2" :color="options.color">
        <v-toolbar-title>
          <span class="text-h6">{{ title }}</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small class="mr-0" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="pt-4 body-1 black--text">
        <slot></slot>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="px-6 py-4">
        <v-spacer></v-spacer>
        <v-btn
          text
          @click.native="close"
        >
          Close
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'InfoDialog',
  props: ['title'],
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      options: {
        color: 'grey lighten-2',
        width: 800,
        zIndex: 5000,
        btnColor: 'primary'
      }
    }
  },

  methods: {
    open (options) {
      this.dialog = true
      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    close () {
      this.resolve(true)
      this.dialog = false
    }
  }
}
</script>
