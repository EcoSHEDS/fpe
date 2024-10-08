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
        <v-toolbar-title class="text-h5">
          <span v-if="!station">Create Station</span>
          <span v-else>Edit Station</span>
        </v-toolbar-title>
      </v-toolbar>

      <v-form ref="stationForm" @submit.prevent="submit">
        <v-card-text class="body-2 py-8 px-4">
          <v-text-field
            v-model="name.value"
            :rules="name.rules"
            label="Station Name"
            counter
            maxlength="50"
            hint="Short name or code (e.g. Brown's Brook or BB001)"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
          <v-text-field
            v-model="description.value"
            :rules="description.rules"
            label="Description"
            counter
            maxlength="128"
            hint="Description of station location (e.g. Brown's Brook at Rt 1 crossing near Auburn)"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model="latitude.value"
                :rules="latitude.rules"
                label="Latitude"
                hint="Decimal degrees in northerly direction (e.g. 42.312)"
                persistent-hint
                validate-on-blur
                outlined
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model="longitude.value"
                :rules="longitude.rules"
                label="Longitude"
                hint="Decimal degrees in westerly direction (e.g. -72.342)"
                persistent-hint
                validate-on-blur
                outlined
              ></v-text-field>
            </v-col>
          </v-row>
          <v-select
            v-model="timezone.value"
            :items="timezone.options"
            :rules="timezone.rules"
            item-text="label"
            item-value="id"
            label="Time Zone"
            validate-on-blur
            outlined
          ></v-select>
          <v-autocomplete
            v-model="waterbodyType.value"
            :items="waterbodyType.options"
            :rules="waterbodyType.rules"
            item-text="label"
            item-value="value"
            label="Waterbody Type"
            validate-on-blur
            outlined
          >
            <template v-slot:item="{ item }">
              <v-list-item-content style="max-width:600px">
                <v-list-item-title v-html="item.label"></v-list-item-title>
                <div class="text-subheading text--secondary" v-html="item.description"></div>
              </v-list-item-content>
            </template>
          </v-autocomplete>
          <v-text-field
            v-model="nwisId.value"
            :rules="nwisId.rules"
            label="USGS NWIS Station ID"
            hint="ID of an existing USGS NWIS station (e.g. 01171090)"
            persistent-hint
            validate-on-blur
            outlined
          ></v-text-field>
          <v-select
            v-model="status.value"
            :items="status.options"
            :rules="status.rules"
            item-text="label"
            item-value="value"
            label="Station Status"
            validate-on-blur
            outlined
            clearable
            hide-details
          >
            <template v-slot:item="{ item }">
              <v-list-item-content style="max-width:600px">
                <v-list-item-title v-html="item.label"></v-list-item-title>
                <div class="text-subheading text--secondary" v-html="item.description"></div>
              </v-list-item-content>
            </template>
          </v-select>
          <v-checkbox
            v-model="private_.value"
            label="Private"
            hint="If checked, station will not appear on public photo explorer"
            persistent-hint
            validate-on-blur
            outlined
          ></v-checkbox>

          <v-alert
            type="error"
            text
            colored-border
            border="left"
            class="body-2 mb-0 mt-8"
            v-if="error">
            <div class="body-1 font-weight-bold">Failed to Save Station</div>
            <div>{{ error }}</div>
          </v-alert>
        </v-card-text>

        <v-divider></v-divider>

        <v-card-actions class="pa-4">
          <v-btn
            type="submit"
            color="primary"
            class="mr-4"
            :loading="loading">submit</v-btn>
          <v-btn text @click="reset">reset</v-btn>
          <v-spacer></v-spacer>
          <v-btn text @click="cancel">cancel</v-btn>
        </v-card-actions>
      </v-form>
    </v-card>
  </v-dialog>
</template>

<script>
import { mapGetters } from 'vuex'
import { stationTimezones, waterbodyTypes, stationStatusTypes } from '@/lib/constants'
import nwis from '@/lib/nwis'
import evt from '@/events'

export default {
  name: 'StationForm',
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      options: {
        color: 'grey lighten-2',
        width: 600,
        zIndex: 5000
      },
      loading: false,
      error: null,
      station: null,
      name: {
        value: '',
        rules: [
          v => !!v || 'Name is required',
          v => (!!v && v.trim().length >= 4) || 'Name must be at least 4 characters',
          v => (!!v && v.trim().length <= 50) || 'Name cannot exceed 50 characters'
        ]
      },
      description: {
        value: '',
        rules: [
          v => !!v || 'Description is required',
          v => (!!v && v.trim().length >= 4) || 'Description must be at least 4 characters',
          v => (!!v && v.trim().length <= 128) || 'Description cannot exceed 128 characters'
        ]
      },
      latitude: {
        value: '',
        rules: [
          v => !!v || 'Latitude is required',
          v => !isNaN(Number(v)) || 'Latitude must be a decimal number',
          v => (Number(v) <= 90 && Number(v) >= -90) || 'Latitude must be between -90 and 90'
        ]
      },
      longitude: {
        value: '',
        rules: [
          v => !!v || 'Longitude is required',
          v => !isNaN(Number(v)) || 'Longitude must be a decimal number',
          v => (Number(v) <= 180 && Number(v) >= -180) || 'Longitude must be between -180 and 180'
        ]
      },
      timezone: {
        value: null,
        options: stationTimezones,
        rules: [
          v => !!v || 'Timezone is required'
        ]
      },
      waterbodyType: {
        value: null,
        options: waterbodyTypes,
        rules: []
      },
      status: {
        value: 'ACTIVE',
        options: stationStatusTypes,
        rules: []
      },
      nwisId: {
        value: '',
        rules: []
      },
      private_: {
        value: false,
        rules: []
      }
    }
  },
  computed: {
    ...mapGetters(['user'])
  },
  methods: {
    open (station) {
      this.dialog = true
      this.station = station
      this.reset()
      if (this.station) {
        this.name.value = this.station.name
        this.description.value = this.station.description
        this.latitude.value = this.station.latitude
        this.longitude.value = this.station.longitude
        this.timezone.value = this.station.timezone
        this.waterbodyType.value = this.station.waterbody_type
        this.status.value = this.station.status
        this.nwisId.value = this.station.nwis_id
        this.private_.value = this.station.private
      }
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    async submit () {
      this.error = null

      if (!this.$refs.stationForm.validate()) return

      this.loading = true
      try {
        const payload = {
          name: this.name.value,
          description: this.description.value,
          latitude: this.latitude.value,
          longitude: this.longitude.value,
          timezone: this.timezone.value,
          waterbody_type: this.waterbodyType.value,
          status: this.status.value,
          private: this.private_.value
        }

        if (this.nwisId.value) {
          await nwis.getStation(this.nwisId.value.trim())
        }
        payload.nwis_id = this.nwisId.value ? this.nwisId.value.trim() : this.nwisId.value

        let response
        if (this.station) {
          response = await this.$http.restricted.put(`/stations/${this.station.id}`, payload)
          evt.$emit('notify', 'success', `Station (${payload.name}) has been updated`)
        } else {
          response = await this.$http.restricted.post('/stations', payload)
          evt.$emit('notify', 'success', `Station (${payload.name}) has been created`)
        }

        this.dialog = false
        this.resolve(response.data)
      } catch (err) {
        if (err.response && err.response.data.message) {
          this.error = err.response.data.message
        } else {
          this.error = err.message || err.toString()
        }
      } finally {
        this.loading = false
      }
    },
    reset () {
      if (!this.$refs.stationForm) return
      this.$refs.stationForm.resetValidation()
      this.loading = false
      this.error = null

      if (this.station) {
        this.name.value = this.station.name
        this.description.value = this.station.description
        this.latitude.value = this.station.latitude
        this.longitude.value = this.station.longitude
        this.timezone.value = this.station.timezone
        this.waterbodyType.value = this.station.waterbody_type
        this.status.value = this.station.status
        this.nwisId.value = this.station.nwis_id
        this.private_.value = this.station.private
      } else {
        this.name.value = null
        this.description.value = null
        this.latitude.value = null
        this.longitude.value = null
        this.timezone.value = null
        this.waterbodyType.value = null
        this.status.value = null
        this.nwisId.value = null
        this.private_.value = false
      }
    },
    cancel () {
      this.resolve(false)
      this.dialog = false
    }
  }
}
</script>
