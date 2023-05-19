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
          Data Source and Methodology
        </v-toolbar-title>
      </v-toolbar>

      <v-card-text class="black--text pt-4">
        <p>
          Please describe the source, methodology, and other metadata associated the flow/stage data that you will upload for this station. All flow/stage data uploaded for this station are assumed to have been generated using the same methodology and data source. Therefore, the metadata defined below will apply to any all dataset files that are uploaded for this station.
        </p>

        <v-divider class="my-4"></v-divider>

        <v-form ref="form">
          <div class="mb-8">
            <div class="text-h6 mb-4">Are The Data Collected By Your Organization?</div>
            <v-btn-toggle v-model="useAffiliation.value" mandatory>
              <v-btn width="80" :value="true">
                YES
              </v-btn>
              <v-btn width="80" :value="false">
                NO
              </v-btn>
            </v-btn-toggle>
          </div>

          <div class="text-h6">Data Source</div>
          <p v-if="useAffiliation.value">
            Your affiliation will be used for attribution.
          </p>
          <p v-else>
            Please provide the name of the organization that collected or owns the data.
          </p>
          <v-text-field
            v-model="source.value"
            :rules="source.rules"
            label="Organization Name"
            validate-on-blur
            outlined
            counter
            maxlength="100"
            :disabled="useAffiliation.value"
          ></v-text-field>

          <div class="text-h6">Methodology</div>
          <p>
            Please describe the methodology used to collect the data<br>
            <span class="text--secondary">Example: "Continuous water level measurements were collected using a Hobo U20 and converted to flow rates using a 12-point rating curve ranging from 20 to 1,200 cfs..."</span>
          </p>
          <p>
            If you obtained the data from another organization, describe how you obtained it and if the values were modified.<br>
            <span class="text--secondary">Example: "Instantaneous flow rates were downloaded from USGS NWIS for Station 01059000 and adjusted using a drainage area ratio of 1.232..."</span>
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
            Please provide a citation for any available QAPP/SOP documents or URL for the original data source.
          </p>
          <v-textarea
            v-model="citation.value"
            :rules="citation.rules"
            label="QAPP/SOP Citation or Data Source URL"
            validate-on-blur
            outlined
          ></v-textarea>

          <div class="text-h6">Flags (optional)</div>
          <p>
            Please provide a comma-separate list describing the flag types used in this dataset (if applicable).<br>
            <span class="text--secondary">Example: "E=estimated value, X=equipment malfunction"</span>
          </p>
          <v-text-field
            v-model="flags.value"
            :rules="flags.rules"
            label="Flag Definitions"
            validate-on-blur
            outlined
          ></v-text-field>
        </v-form>
      </v-card-text>

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
  name: 'DatasetMetadataForm',
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
      },
      flags: {
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
      return !!(this.station && this.station.metadata && this.station.metadata.dataset)
    },
    stationMetadata () {
      return this.stationHasMetadata ? this.station.metadata.dataset : null
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
      payload.metadata.dataset = {
        useAffiliation: this.useAffiliation.value,
        source: this.useAffiliation.value ? null : this.source.value,
        methodology: this.methodology.value,
        citation: this.citation.value,
        flags: this.flags.value
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
        this.flags.value = this.stationMetadata.flags
        this.citation.value = this.stationMetadata.citation
      } else {
        this.useAffiliation.value = true
        this.methodology.value = ''
        this.flags.value = ''
        this.citation.value = ''
      }
      this.updateSourceValue()
    },
    updateSourceValue () {
      this.source.value = this.useAffiliation.value
        ? this.dbUser.affiliation_name
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
