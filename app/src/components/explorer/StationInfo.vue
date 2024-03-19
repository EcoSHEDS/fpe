<template>
  <div>
    <v-simple-table dense>
      <tbody>
        <tr>
          <td class="text-right grey--text text--darken-2">
            Affiliation
          </td>
          <td class="font-weight-bold">{{ station.affiliation_name }}</td>
        </tr>
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
            Waterbody Type
          </td>
          <td class="font-weight-bold">
            {{ station.waterbody_type | waterbodyType }}
          </td>
        </tr>
        <!-- <tr>
          <td class="text-right grey--text text--darken-2">
            NWIS ID
          </td>
          <td class="font-weight-bold">
            <a
              v-if="!!station.nwis_id"
              :href="`https://waterdata.usgs.gov/nwis/inventory/?site_no=${station.nwis_id}&agency_cd=USGS`"
              target="_blank"
            >
              {{ station.nwis_id }}
            </a>
          </td>
        </tr> -->
        <tr>
          <td class="text-right grey--text text--darken-2">
            Status
          </td>
          <td class="font-weight-bold">
            {{ station.status | stationStatus }}
          </td>
        </tr>
      </tbody>
    </v-simple-table>

    <v-divider></v-divider>

    <!-- Model SUMMARY -->
    <div class="text-subtitle-2 text--secondary pa-2 grey lighten-4">
      Models
    </div>
    <v-divider></v-divider>
    <div v-if="station.models.length > 0">
      <!-- <v-alert text class="mb-0" type="success">
        Models available
      </v-alert> -->

      <v-simple-table dense>
        <tbody>
          <tr>
            <td class="text-right grey--text text--darken-2">
              Model Types:
            </td>
            <td class="font-weight-bold">
              {{ station.models.map(m => `${m.model_type_id}[${m.variable_id}]`).join(', ') }}
            </td>
          </tr>
        </tbody>
      </v-simple-table>
      <v-divider></v-divider>

      <div class="ma-2">
        <v-dialog
          v-model="dialogs.models"
          max-width="1000"
          style="z-index:1000"
          scrollable
        >
          <template v-slot:activator="{ on }">
            <v-btn color="success" depressed block v-on="on">View Available Models</v-btn>
          </template>

          <v-card>
            <v-card-title class="text-h6 grey lighten-2 mb-4 pr-2">
              Model Summary
              <v-spacer></v-spacer>
              <v-btn color="default" icon small @click="dialogs.models = false">
                <v-icon small>mdi-close</v-icon>
              </v-btn>
            </v-card-title>

            <v-card-text class="body-1 black--text">
              <p>The following table lists the available models that have been trained on this station. All model results are <strong>PROVISIONAL</strong> until noted otherwise.</p>

              <v-simple-table>
                <template v-slot:default>
                  <thead>
                    <tr>
                      <th class="text-left">Default</th>
                      <th class="text-left">Model ID</th>
                      <th class="text-left">Type</th>
                      <th class="text-left">Variable</th>
                      <th class="text-left">Trained On</th>
                      <th class="text-left">Diagnostics Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="model in station.models" :key="model.id">
                      <td style="width:10px" class="text-center">
                        <v-simple-checkbox :value="model.default" disabled label=""></v-simple-checkbox>
                      </td>
                      <td>{{ model.code }}</td>
                      <td>{{ model.model_type_id }}</td>
                      <td>{{ model.variable_id }}</td>
                      <td>{{ model.updated_at | formatTimestamp('local', 'DD') }}</td>
                      <td>
                        <a :href="model.diagnostics_url" target="_blank">Diagnostics</a> <v-icon small right>mdi-open-in-new</v-icon>
                      </td>
                    </tr>
                  </tbody>
                </template>
              </v-simple-table>
            </v-card-text>

            <v-divider></v-divider>

            <v-card-actions>
              <v-spacer></v-spacer>
              <v-btn
                color="default"
                text
                @click="dialogs.models = false"
              >
                Close
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-dialog>
      </div>
    </div>
    <div v-else>
      <v-alert text class="mb-0" type="info" color="warning">
        No models available.
      </v-alert>
    </div>

    <v-divider></v-divider>

    <!-- PHOTO -->
    <div class="text-subtitle-2 text--secondary px-2 py-2 grey lighten-4">
      Photos
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
              {{ station.summary.images.start_date | formatDate }} &#8211;
              {{ station.summary.images.end_date | formatDate }}
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
              Collected By
            </td>
            <td class="font-weight-bold">{{ imageSource }}</td>
          </tr>
        </tbody>
      </v-simple-table>
      <v-divider></v-divider>
      <div class="ma-2">
        <v-dialog
          v-model="dialogs.imageset"
          max-width="800"
          style="z-index:1000"
        >
          <template v-slot:activator="{ on }">
            <v-btn depressed block small v-on="on">View Photo Methodology</v-btn>
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

    <v-divider></v-divider>

    <!-- DATA [NWIS] -->
    <div v-if="!!station.nwis_id">
      <div class="text-subtitle-2 text--secondary pa-2 grey lighten-4">
        Observed Data (NWIS)
      </div>
      <v-divider></v-divider>
      <div>
        <v-simple-table dense>
          <tbody>
            <tr>
              <td class="text-right grey--text text--darken-2">
                Source
              </td>
              <td class="font-weight-bold">
                <a href="https://waterdata.usgs.gov/nwis" target="_blank" >
                  USGS NWIS
                </a>
              </td>
            </tr>
            <tr>
              <td class="text-right grey--text text--darken-2">
                Station ID
              </td>
              <td class="font-weight-bold">
                <a
                  :href="`https://waterdata.usgs.gov/nwis/inventory/?site_no=${station.nwis_id}&agency_cd=USGS`"
                  target="_blank"
                >
                  {{ station.nwis_id }}
                </a>
              </td>
            </tr>
            <tr>
              <td class="text-right grey--text text--darken-2">
                Variables
              </td>
              <td class="font-weight-bold">FLOW_CFS</td>
            </tr>
          </tbody>
        </v-simple-table>
      </div>
    </div>

    <!-- DATA [FPE] -->
    <div v-if="station.summary.values.count > 0">
      <div class="text-subtitle-2 text--secondary pa-2 grey lighten-4">
        Observed Data
      </div>
      <v-divider></v-divider>
      <div>
        <v-simple-table dense>
          <tbody>
            <tr>
              <td class="text-right grey--text text--darken-2">
                Variables
              </td>
              <td class="font-weight-bold">{{ station.summary.values.variables.map(d => d.variable_id).join(', ') }}</td>
            </tr>
            <tr>
              <td class="text-right grey--text text--darken-2">
                Period
              </td>
              <td class="font-weight-bold">
                {{ station.summary.values.start_date | formatDate }} &#8211;
                {{ station.summary.values.end_date | formatDate }}
              </td>
            </tr>
            <tr>
              <td class="text-right grey--text text--darken-2">
                Collected By
              </td>
              <td class="font-weight-bold">{{ dataSource }}</td>
            </tr>
          </tbody>
        </v-simple-table>

        <v-divider></v-divider>

        <div class="ma-2">
          <v-dialog
            v-model="dialogs.dataset"
            max-width="800"
            style="z-index:1000"
            scrollable
          >
            <template v-slot:activator="{ on }">
              <v-btn depressed small block v-on="on">View Data Methodology</v-btn>
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
    </div>

    <div v-if="!station.nwis_id && station.summary.values.count === 0">
      <div class="text-subtitle-2 text--secondary pa-2 grey lighten-4">
        Observed Data
      </div>
      <v-divider></v-divider>
      <div>
        <v-alert text class="mb-0" type="info" color="grey darken-2">
          No observed data are available.
        </v-alert>
      </div>
    </div>
    <v-divider></v-divider>
  </div>
</template>

<script>
export default {
  name: 'StationInfo',
  props: ['station'],
  data () {
    return {
      dialogs: {
        imageset: false,
        dataset: false,
        models: false
      }
    }
  },
  computed: {
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
  width: 140px;
}
</style>
