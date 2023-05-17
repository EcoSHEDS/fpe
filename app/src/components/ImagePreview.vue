<template>
  <div class="d-flex justify-center align-center flex-column">
    <div style="width:100%">
      <v-img
        lazy-src="img/placeholder.png"
        :src="image.thumb_url"
        :alt="image.filename"
        v-if="image.status === 'DONE'"
        @click="$emit('click', image)"
        style="cursor:pointer"
      >
      </v-img>
      <v-img src="img/placeholder.png" :alt="image.filename" max-width="200" v-else></v-img>
    </div>
    <div class="fpe-image-preview-filename text-subtitle-2 font-weight-bold">{{ image.filename }}</div>
    <div class="text-caption" style="width:100%">
      <div v-if="image.status === 'DONE'">
        {{ timestampLocal }}
      </div>
      <div>
        <v-chip :color="image.pii_off ? 'gray' : 'error'" v-if="image.pii_person >= 0.2" class="my-1 mr-1" small>Person Detected ({{image.pii_person.toFixed(2)}})</v-chip>
        <v-chip :color="image.pii_off ? 'gray' : 'error'" v-if="image.pii_vehicle >= 0.8" class="my-1 mr-1" small>Vehicle Detected ({{image.pii_vehicle.toFixed(2)}})</v-chip>
        <v-chip color="gray" v-if="image.pii_animal >= 0.8" class="my-1 mr-1" small>Animal Detected ({{image.pii_animal.toFixed(2)}})</v-chip>
        <v-chip color="error" v-if="image.pii_on" class="my-1 mr-1" small>Manual PII Flag</v-chip>
        <v-chip color="gray" v-if="image.pii_off" class="my-1 mr-1" small>PII Detection Ignored</v-chip>
      </div>
    </div>
    <div class="d-flex" style="width:100%">
      <div>
        <v-tooltip bottom max-width="400px" open-delay="500" v-if="image.status === 'DONE'">
          <template v-slot:activator="{ on }">
            <v-btn
              small
              icon
              v-on="on"
              @click="$emit('flag', image)"
            >
              <v-icon v-if="imagePiiFlag(image)" color="error">mdi-flag</v-icon>
              <v-icon v-else>mdi-flag-outline</v-icon>
            </v-btn>
          </template>
          <span v-if="image.pii_on">Unflag Photo for PII<br>(Remove Manual PII Flag)</span>
          <span v-else-if="imagePiiFlag(image)">Unflag Photo for PII<br>(Ignore Detection)</span>
          <span v-else-if="image.pii_off">Flag Photo for PII<br>(Stop Ignoring PII Detection)</span>
          <span v-else>Flag Photo for PII<br>(Add Manual PII Flag)</span>
        </v-tooltip>
      </div>
      <v-spacer></v-spacer>
      <div>
        <v-tooltip bottom max-width="400px" open-delay="500" v-if="image.status === 'DONE'">
          <template v-slot:activator="{ on }">
            <v-btn
              small
              icon
              v-on="on"
              @click="$emit('delete', image)"
            >
              <v-icon>mdi-delete</v-icon>
            </v-btn>
          </template>
          <span>Delete Image</span>
        </v-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import { imagePiiFlag } from '@/lib/utils'

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
  },
  methods: {
    imagePiiFlag
  }
}
</script>

<style scoped>
.fpe-image-preview-filename {
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
