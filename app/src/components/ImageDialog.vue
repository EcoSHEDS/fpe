<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
  >
    <v-card v-if="image">
      <v-toolbar dense flat elevation="2" :color="options.color">
        <v-toolbar-title>
          <span class="text-h5">Photo | </span>
          <span class="body-1">{{ image.filename }}</span>
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon small class="mr-0" @click="close">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-toolbar>
      <v-card-text class="pt-4">
        <v-sheet rounded class="pa-4" elevation="2">
          <v-img
            lazy-src="img/placeholder.png"
            :src="image.full_url"
            :alt="image.filename"
            :max-width="options.width"
          >
          </v-img>

          <v-simple-table dense class="mt-4">
            <tbody>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:80px">
                  Filename
                </td>
                <td class="font-weight-bold">{{ image.filename }}</td>
              </tr>
              <tr>
                <td
                  class="text-right grey--text text--darken-2"
                  style="width:80px"
                >
                  Timestamp
                </td>
                <td class="font-weight-bold">
                  {{ image.timestamp | timestampLocalFormat(station.timezone, 'lll z') }}
                </td>
              </tr>
            </tbody>
          </v-simple-table>
        </v-sheet>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions class="px-6 py-4">
        <v-btn
          color="primary"
          download
          :href="image.full_url"
          :disabled="!image.full_url"
        >
          <v-icon left>mdi-download</v-icon> Download Photo
        </v-btn>
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
  name: 'ImageDialog',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      image: null,
      options: {
        color: 'grey lighten-2',
        width: 1000,
        zIndex: 5000,
        btnColor: 'primary'
      }
    }
  },

  methods: {
    open (image, station, options) {
      this.dialog = true
      this.image = image
      this.station = station
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
