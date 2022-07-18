<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card>
      <v-toolbar :color="options.color">
        <v-toolbar-title class="text-h6">
          {{ title }}
        </v-toolbar-title>
      </v-toolbar>
      <v-card-text class="mt-8 mb-0">
        <slot></slot>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="px-6 py-4">
        <v-btn
          :color="options.btnColor"
          @click.native="agree"
        >
          <v-icon left>mdi-check</v-icon> Confirm
        </v-btn>
        <v-spacer></v-spacer>
        <v-btn
          v-if="!options.noconfirm"
          text
          @click.native="cancel"
        >
          Cancel
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'ConfirmDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      title: null,
      options: {
        color: 'grey lighten-2',
        width: 600,
        zIndex: 5000,
        noconfirm: false,
        btnColor: 'primary'
      }
    }
  },

  methods: {
    open (title, options) {
      this.dialog = true
      this.title = title
      this.options = Object.assign(this.options, options)
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    agree () {
      this.resolve(true)
      this.dialog = false
    },
    cancel () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
