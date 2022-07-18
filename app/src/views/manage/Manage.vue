<template>
  <v-container class="black--text">
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4">
          <v-toolbar dense flat color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Upload Photos and Data
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="pt-2">
            <v-container class="black--text body-1 px-0">
              <v-row align="stretch">
                <v-col cols="12" md="6">
                  <v-card elevation="2" height="100%">
                    <v-card-title class="text-h5 py-2">
                      Instructions
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="black--text body-1">
                      <p>
                        Follow these four steps to upload your photos and data:
                      </p>
                      <ol class="my-4 ml-4">
                        <li>Click the <strong>New Station</strong> button below to create your first station</li>
                        <li>Go to the <strong>Photos</strong> tab for that station to upload photos</li>
                        <li>Go to the <strong>Data</strong> tab to upload streamflow/stage data</li>
                        <li>Repeat steps 1-3 for each additional station</li>
                      </ol>
                      <p>To add photos or data to an existing station, click on the row of that station in the table below.</p>
                    </v-card-text>
                  </v-card>
                </v-col>
                <v-col cols="12" md="6">
                  <v-card elevation="2">
                    <v-card-title class="text-h5 py-2">
                      Frequently Asked Questions
                    </v-card-title>
                    <v-divider></v-divider>
                    <v-card-text class="black--text body-1" style="overflow-y:auto;max-height:290px">
                      <div class="font-weight-bold">What Kind of Photos Should I Upload?</div>
                      <p>
                        Timelapse photos collected at hourly intervals during daylight hours. Photos must not be subject to copyright or other restrictions since they will be publicly displayed on the Photo Explorer (unless the associated station is made private, see below).
                      </p>

                      <div class="font-weight-bold">What Kind of Data Should I Upload?</div>
                      <p>
                        Continuous measurements of streamflow and/or stage at hourly or greater frequency only during the period for which you have photos. Please do not upload daily data.
                      </p>

                      <div class="font-weight-bold">How Do I Upload Photos and Data?</div>
                      <p>
                        First, create a station by clicking the <strong>New Station</strong> button below.
                      </p>
                      <p>
                        Once a station has been created, go to the <strong>Photos</strong> tab, fill out the <strong>Photo Source and Methodology</strong> form, and then click <strong>Upload Photos</strong>.
                      </p>
                      <p>
                        To upload data, go to the <strong>Data</strong> tab, fill out the <strong>Data Source and Metholodogy</strong> form, and then click <strong>Upload File</strong>.
                      </p>

                      <div class="font-weight-bold">How Will My Photos and Data Be Used?</div>
                      <p>
                        Your data and photos will be used to develop machine learning models for predicting streamflow/stage from timelapse photos. They will also be publicly displayed on the <strong>Photo Explorer</strong> unless the station is marked as private (see below).
                      </p>

                      <div class="font-weight-bold">Will My Photos and Data Be Attributed?</div>
                      <p>
                        Only your affiliation will be publicly displayed as being associated with your stations on the <strong>Photo Explorer</strong>. Your name and email will never be publicly displayed.
                      </p>

                      <div class="font-weight-bold">How do I keep my photos and data private?</div>
                      <p>
                        To exclude images and data from being shown on the public photo explorer, mark the associated station as Private on the create or edit station form. Note that the images and data may still be used for model development, but will not be made publicly available.
                      </p>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-container>
            <!-- <v-sheet elevation="2" class="mb-4 pa-2" style="overflow-y:auto" max-height="300">
              <Instructions></Instructions>
            </v-sheet> -->
            <v-sheet elevation="2">
              <Stations></Stations>
            </v-sheet>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Stations from '@/views/manage/Stations.vue'

export default {
  name: 'Manage',
  components: { Stations }
}
</script>
