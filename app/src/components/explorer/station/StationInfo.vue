<template>
  <div>
    <div style="height:210px;width:100%">
      <StationsMap
        :stations="[station]"
        :station="station"
      ></StationsMap>
    </div>
    <v-divider></v-divider>
    <v-simple-table dense>
      <tbody>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Name
          </td>
          <td class="font-weight-bold">{{ station.name }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Description
          </td>
          <td class="font-weight-bold">{{ station.description || 'N/A' }}</td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Coordinates
          </td>
          <td class="font-weight-bold">
            {{ station.latitude.toFixed(5) }}, {{ station.longitude.toFixed(5) }}
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Timezone
          </td>
          <td class="font-weight-bold">
            {{ station.timezone }}
          </td>
        </tr>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Affiliation
          </td>
          <td class="font-weight-bold">{{ station.affiliation_name }}</td>
        </tr>
      </tbody>
    </v-simple-table>
    <v-divider></v-divider>

    <!-- PHOTO SUMMARY -->
    <div class="text-subtitle-2 text--secondary pa-2 grey lighten-4">
      Photos Summary
    </div>
    <v-divider></v-divider>
    <div class="body-2 ma-2 font-weight-bold" v-if="!station.summary.images || station.summary.images.count == 0">
      No Photos Available
    </div>
    <div v-else>
      <v-simple-table dense>
        <tbody>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Period
            </td>
            <td class="font-weight-bold">
              {{ station.summary.images.start_date | timestampFormat('ll') }} &#8211;
              {{ station.summary.images.end_date | timestampFormat('ll') }}
            </td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              # Photos
            </td>
            <td class="font-weight-bold">{{ station.summary.images.count.toLocaleString() }}</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Source
            </td>
            <td class="font-weight-bold">{{ imageSource }}</td>
          </tr>
        </tbody>
      </v-simple-table>
      <div class="ma-2">
        <v-dialog
          v-model="dialogs.imageset"
          max-width="800"
          style="z-index:1000"
        >
          <template v-slot:activator="{ on }">
            <v-btn color="primary" outlined block small v-on="on">View Photo Methodology</v-btn>
          </template>

          <v-card>
            <v-card-title class="text-h6 grey lighten-2 mb-4 pr-2">
              Image Source and Methodology
              <v-spacer></v-spacer>
              <v-btn color="default" icon small @click="dialogs.imageset = false">
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text v-if="station.metadata.imageset" class="body-1 black--text">
              <div class="font-weight-bold text-subtitle-1">Image Source</div>
              <p v-if="station.metadata.imageset.useAffiliation">{{ station.affiliation_name }}</p>
              <p v-else>{{ station.metadata.imageset.source || 'Not Provided' }}</p>
              <div class="font-weight-bold text-subtitle-1 mt-4">Methodology</div>
              <p style="white-space:pre-line">{{ station.metadata.imageset.methodology || 'Not Provided' }}</p>
              <div class="font-weight-bold text-subtitle-1 mt-4">Citation</div>
              <p style="white-space:pre-line">{{ station.metadata.imageset.citation || 'Not Provided' }}</p>
            </v-card-text>
            <v-card-text v-else>
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
              >
                <div class="font-weight-bold body-1">Not Available</div>
                <div>
                  The photo source and methodology have not been provided for this station.
                </div>
              </v-alert>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="default"
                text
                @click="dialogs.imageset = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </div>

    <!-- DATA SUMMARY -->
    <div class="text-subtitle-2 text--secondary pa-2 grey lighten-4">
      Dataset Summary
    </div>
    <v-divider></v-divider>
    <div class="body-2 ma-2 font-weight-bold" v-if="station.summary.values.count == 0">
      No Data Available
    </div>
    <div v-else>
      <v-simple-table dense>
        <tbody>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Period
            </td>
            <td class="font-weight-bold">
              {{ station.summary.values.start_date | timestampFormat('ll') }} &#8211;
              {{ station.summary.values.end_date | timestampFormat('ll') }}
            </td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Variables
            </td>
            <td class="font-weight-bold">{{ station.summary.values.variables.map(d => d.variable_id).join(', ') }}</td>
          </tr>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Source
            </td>
            <td class="font-weight-bold">{{ dataSource }}</td>
          </tr>
        </tbody>
      </v-simple-table>
      <div class="ma-2">
        <v-dialog
          v-model="dialogs.dataset"
          max-width="800"
          style="z-index:1000"
          scrollable
        >
          <template v-slot:activator="{ on }">
            <v-btn color="primary" outlined block small v-on="on">View Data Methodology</v-btn>
          </template>

          <v-card>
            <v-card-title class="text-h6 grey lighten-2 mb-4 pr-2">
              Dataset Source and Methodology
              <v-spacer></v-spacer>
              <v-btn color="default" icon small @click="dialogs.dataset = false">
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text v-if="station.metadata.dataset" class="body-1 black--text">
              <div class="font-weight-bold text-subtitle-1">Dataset Source</div>
              <p v-if="station.metadata.dataset.useAffiliation">{{ station.affiliation_name }}</p>
              <p v-else>{{ station.metadata.dataset.source || 'Not Provided' }}</p>
              <div class="font-weight-bold text-subtitle-1 mt-4">Methodology</div>
              <p style="white-space:pre-line">{{ station.metadata.dataset.methodology || 'Not Provided' }}</p>
              <div class="font-weight-bold text-subtitle-1 mt-4">Citation</div>
              <p style="white-space:pre-line">{{ station.metadata.dataset.citation || 'Not Provided' }}</p>
              <div class="font-weight-bold text-subtitle-1 mt-4">Flags</div>
              <p>{{ station.metadata.dataset.flags || 'Not Provided' }}</p>
            </v-card-text>
            <v-card-text v-else>
              <v-alert
                type="warning"
                text
                colored-border
                border="left"
                class="body-2 mb-0"
              >
                <div class="font-weight-bold body-1">Not Available</div>
                <div>
                  The data source and methodology have not been provided for this station.
                </div>
              </v-alert>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="default"
                text
                @click="dialogs.dataset = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </div>

    <v-divider v-if="user && user.username && station.user_id === user.username"></v-divider>

    <div class="px-2 my-4" v-if="user && user.username && station.user_id === user.username">
      <v-btn
        color="primary"
        block
        large
        :to="{ name: 'manageStation', params: { stationId: station.id } }"
      >
        <v-icon left>mdi-cog</v-icon> manage station
      </v-btn>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'

import StationsMap from '@/components/explorer/StationsMap'

export default {
  name: 'StationInfo',
  props: ['station'],
  components: {
    StationsMap
  },
  data () {
    return {
      dialogs: {
        imageset: false,
        dataset: false
      }
    }
  },
  computed: {
    ...mapGetters(['user', 'affiliation']),
    imageSource () {
      if (!this.station || !this.station.metadata || !this.station.metadata.imageset) return 'None'
      return this.station.metadata.imageset.useAffiliation
        ? this.station.affiliation_name
        : this.station.metadata.imageset.source
    },
    dataSource () {
      if (!this.station || !this.station.metadata || !this.station.metadata.dataset) return 'None'
      return this.station.metadata.dataset.useAffiliation
        ? this.station.affiliation_name
        : this.station.metadata.dataset.source
    }
  }
}
</script>

<style scoped>
tr > td:first-child {
  width: 115px;
}
</style>
