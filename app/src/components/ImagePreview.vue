<template>
  <div class="d-flex justify-center align-center flex-column">
    <div style="max-width:100%">
      <v-img
        lazy-src="@/assets/img/placeholder.png"
        :src="image.thumb_url"
        :alt="image.filename"
        max-width="200"
        v-if="image.status === 'DONE'"
        @click="$emit('click', image)"
        style="cursor:pointer"
      >
      </v-img>
      <v-img src="@/assets/img/placeholder.png" :alt="image.filename" max-width="200" v-else></v-img>
      <v-tooltip bottom max-width="400px" open-delay="500" v-if="image.status === 'DONE'">
        <template v-slot:activator="{ on }">
          <v-btn
            small
            icon
            v-on="on"
            @click="$emit('delete', image)"
            style="position:absolute;top:-10px;right:-10px"
          >
            <v-icon>mdi-close-circle</v-icon>
          </v-btn>
        </template>
        <span>Delete image</span>
      </v-tooltip>
    </div>
    <div class="text-caption text-center">
      <div>{{ image.filename | truncate(20) }}</div>
      <div v-if="image.status === 'DONE'">
        {{ timestampLocal }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ImagePreview',
  props: {
    image: {
      type: Object,
      required: true
    },
    timezone: {
      type: String,
      required: true
    }
  },
  computed: {
    timestampLocal () {
      const { timestamp } = this.image

      if (!timestamp) return 'Missing Timestamp'

      return this.$date(timestamp)
        .tz(this.timezone)
        .format('M/DD/YYYY h:mm a z')
    }
  }
}
</script>
