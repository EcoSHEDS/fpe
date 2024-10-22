<template>
  <v-dialog
    v-model="dialog"
    :max-width="options.width"
    :style="{ zIndex: options.zIndex }"
    @keydown.esc="cancel"
    scrollable
  >
    <v-card>
      <v-toolbar :color="options.color">
        <v-toolbar-title class="text-h6">
          Photo Source and Methodology
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="black--text pt-4" v-if="station">
        <p>
          Please describe the source, methodology, and other metadata associated with the photos that you will upload for this station. All photos uploaded for this station are assumed to have been collected using the same methodology and data source. Therefore, the metadata defined below will apply to any all photos that are uploaded for this station.
        </p>

        <v-divider class="my-4"></v-divider>

        <v-form ref="form">
          <div class="mb-8">
            <div class="text-h6 mb-4">Are the Photos Collected by <span v-if="station.user_id === dbUser.username">Your</span><span v-else>the Station Owner's</span> Organization?</div>
            <v-btn-toggle v-model="useAffiliation.value" mandatory>
              <v-btn width="80" :value="true">
                YES
              </v-btn>
              <v-btn width="80" :value="false">
                NO
              </v-btn>
            </v-btn-toggle>
          </div>

          <div class="text-h6">Photo Source</div>
          <p v-if="useAffiliation.value">
            <span v-if="station.user_id === dbUser.username">Your</span><span v-else>The station owner's</span> affiliation will be used for attribution.
          </p>
          <p v-else>
            Please provide the name of the organization that collected or owns the iamges.
          </p>
          <v-text-field
            v-model="source.value"
            :rules="source.rules"
            label="Organization Name"
            validate-on-blur
            outlined
            counter
            maxlength="128"
            :disabled="useAffiliation.value"
          ></v-text-field>

          <div class="text-h6">Methodology</div>
          <p>
            Please describe the methodology used to collect the photos.<br>
            <span class="text--secondary">Example: "A game camera was installed on a fixed platform along the east bank of the river and pointed upstream..."</span>
          </p>
          <p>
            Also, if the photos were obtained from another organization, describe how you obtained these photos and if they were modified or processed in any way.<br>
            <span class="text--secondary">Example: "Photos were downloaded from the NEON Land-water interface photos for Hop Brook (MA-D01-HOPB)..."</span>
          </p>
          <v-textarea
            v-model="methodology.value"
            :rules="methodology.rules"
            label="Methodology"
            validate-on-blur
            outlined
            @blur="methodology.value = methodology.value.trim()"
            class="mt-4"
          ></v-textarea>

          <div class="text-h6">Citation (optional)</div>
          <p>
            Please provide a citation for any available QAPP/SOP documents or URL for the original photo source.
          </p>
          <v-textarea
            v-model="citation.value"
            :rules="citation.rules"
            label="QAPP/SOP Citation or Photo Source URL"
            validate-on-blur
            outlined
          ></v-textarea>
        </v-form>
      </v-card-text>
      <v-card-text v-else>Loading...</v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="py-4 px-8">
        <v-btn
          color="primary"
          class="mr-4"
          :loading="loading"
          @click="submit">save</v-btn>
        <v-btn text @click="reset">reset</v-btn>
        <v-spacer></v-spacer>
        <v-btn text @click="cancel">cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  name: 'ImagesetMetadataForm',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      options: {
        color: 'grey lighten-2',
        width: 800,
        zIndex: 5000
      },
      loading: false,
      error: null,
      station: null,
      useAffiliation: {
        value: true
      },
      source: {
        value: '',
        rules: [
          v => !!v || 'Organization name is required',
          v => !v || v.length <= 128 || 'Organization name cannot exceed 128 characters'
        ]
      },
      methodology: {
        value: '',
        rules: []
      },
      citation: {
        value: '',
        rules: []
      }
    }
  },
  watch: {
    'useAffiliation.value' () {
      this.updateSourceValue()
    }
  },
  computed: {
    ...mapGetters(['dbUser']),
    stationHasMetadata () {
      return !!(this.station && this.station.metadata && this.station.metadata.imageset)
    },
    stationMetadata () {
      return this.stationHasMetadata ? this.station.metadata.imageset : null
    }
  },
  methods: {
    open (station) {
      this.dialog = true
      this.station = station
      this.$nextTick(() => {
        this.reset()
      })
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) return

      this.loading = true
      const payload = {
        id: this.station.id,
        metadata: {}
      }
      if (this.station.metadata) {
        payload.metadata = { ...this.station.metadata }
      }
      payload.metadata.imageset = {
        useAffiliation: this.useAffiliation.value,
        source: this.useAffiliation.value ? null : this.source.value,
        methodology: this.methodology.value,
        citation: this.citation.value
      }
      try {
        const response = await this.$http.restricted.put(`/stations/${this.station.id}`, payload)

        this.dialog = false
        this.resolve(response.data)
      } catch (err) {
        console.log(err)
        this.error = err.message || err.toString()
      } finally {
        this.loading = false
      }
    },
    reset () {
      if (!this.$refs.form) return
      if (!this.dbUser) return
      this.$refs.form.resetValidation()
      this.loading = false
      this.error = null
      if (this.stationHasMetadata) {
        this.useAffiliation.value = this.stationMetadata.useAffiliation
        this.methodology.value = this.stationMetadata.methodology
        this.citation.value = this.stationMetadata.citation
      } else {
        this.useAffiliation.value = true
        this.methodology.value = ''
        this.citation.value = ''
      }
      this.updateSourceValue()
    },
    updateSourceValue () {
      this.source.value = this.useAffiliation.value
        ? this.station.affiliation_name
        : this.stationHasMetadata
          ? this.stationMetadata.source
          : ''
    },
    cancel () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
