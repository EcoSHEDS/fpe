<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title primary-title>
            <div class="text-h5">Upload Photo Set</div>
          </v-card-title>
          <v-stepper v-model="step">
            <v-stepper-header>
              <!-- STEP 1: INSTRUCTIONS -->
              <v-stepper-step
                :complete="step > 1"
                step="1">
                Instructions
              </v-stepper-step>

              <v-divider></v-divider>

              <!-- STEP 2: FILES -->
              <v-stepper-step
                :complete="step > 2"
                step="2">
                Files
              </v-stepper-step>

              <v-divider></v-divider>

              <!-- STEP 3: CONFIRM STATION -->
              <v-stepper-step
                :complete="step > 3"
                step="3">
                Confirm Station
              </v-stepper-step>

              <v-divider></v-divider>

              <!-- STEP 4: TIMESTAMPS -->
              <v-stepper-step
                :complete="step > 4"
                step="4">
                Timestamps
              </v-stepper-step>

              <v-divider></v-divider>

              <!-- STEP 5: ADDITIONAL INFO -->
              <v-stepper-step
                :complete="step > 5"
                step="5">
                Additional Info
              </v-stepper-step>

              <v-divider></v-divider>

              <!-- STEP 6: FINISH -->
              <v-stepper-step step="6">
                Finish
              </v-stepper-step>
            </v-stepper-header>

            <v-stepper-items class="body-1">
              <!-- STEP 1: INSTRUCTIONS -->
              <v-stepper-content step="1">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <div class="text-h6">Instructions</div>
                    <p>Use this form to upload a new batch of photos.</p>

                    <div class="font-weight-bold">Requirements</div>
                    <ul class="mt-2 body-2">
                      <li>Photos must be collected by a <strong>single camera</strong> at a <strong>fixed position and viewpoint</strong>. Small movements due to wind or other external factors are okay, but if the camera was moved or repositioned during the deployment then please upload the photos from before and after the movement as seperate batches.</li>
                      <li>Photos must be collected at <strong>regular time interval</strong> (hourly) and over a <strong>continuous period</strong> (no gaps except for nighttime, see next point).</li>
                      <li><strong>Nighttime photos are optional</strong>. We recommend configuring your camera to only collect photos during the daytime since nighttime photos will likely not be used.</li>
                      <li>Each file must be in <strong>JPEG format</strong> with a *.jpg or *.jpeg.</li>
                      <li>Files may use <strong>any file naming scheme</strong>. Timestamps and other metadata are extracted from the embedded EXIF data (see next point) so the filename does not matter.</li>
                      <li>Each file must contain an <strong>accurate timestamp within its EXIF data</strong>. Be sure to set the date and time on the camera correctly before collecting photos! If the timestamps are incorrect in the files, try using free tools such as <a href="https://exiftool.org/" target="_blank">ExifTool</a> or <a href="http://www.friedemann-schmidt.com/software/exifer/" target="_blank">Exifer (Windows only)</a> to adjust them.</li>
                    </ul>

                    <v-row class="mt-8 mb-4 px-3">
                      <v-btn text class="mr-4 px-4" :disabled="true">
                        <v-icon left>mdi-chevron-left</v-icon> Previous
                      </v-btn>
                      <v-btn color="primary" class="mr-4 px-4" @click="step += 1">
                        Continue <v-icon right>mdi-chevron-right</v-icon>
                      </v-btn>

                      <v-spacer></v-spacer>

                      <v-btn text @click="$router.push({ name: 'manageImagesets' })">
                        Cancel
                      </v-btn>
                    </v-row>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- STEP 2: FILES -->
              <v-stepper-content step="2">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <div class="text-h6">Select Photo Files</div>
                    <ul class="mt-2 body-2">
                      <li>Each file must be in <strong>JPEG format</strong> with a *.jpg or *.jpeg.</li>
                      <li>Files may use <strong>any file naming scheme</strong>. Timestamps and other metadata are extracted from the embedded EXIF data (see next point) so the filename does not matter.</li>
                      <li>Each file must contain an <strong>accurate timestamp within its EXIF data</strong>. Be sure to set the date and time on the camera correctly before collecting photos! If the timestamps are incorrect in the files, try using free tools such as <a href="https://exiftool.org/" target="_blank">ExifTool</a> or <a href="http://www.friedemann-schmidt.com/software/exifer/" target="_blank">Exifer (Windows only)</a> to adjust them.</li>
                    </ul>

                    <v-form ref="fileForm">
                      <v-file-input
                        v-model="files.selected"
                        :rules="files.rules"
                        label="Select photo files"
                        truncate-length="200"
                        multiple
                        class="mt-4"
                        @change="selectFiles"
                      ></v-file-input>

                      <v-alert
                        type="info"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        v-if="files.loading"
                      >
                        <div class="font-weight-bold body-1">Validating Photos</div>
                        <div>Checking that each photo contains EXIF data.</div>

                        <div class="my-4 font-weight-bold">
                          {{files.message}}
                        </div>
                        <v-progress-linear
                          :active="true"
                          color="primary"
                          height="8"
                          :value="files.progress"
                        ></v-progress-linear>
                        <div class="text-right">
                          {{ (files.progress).toFixed(0) }}% Complete
                        </div>
                      </v-alert>

                      <v-alert
                        type="success"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        v-else-if="!!files.valid"
                      >
                        <div class="font-weight-bold body-1">Validation Complete</div>

                        <div class="mt-4 body-1">
                          <table>
                            <tbody>
                              <tr>
                                <td class="text-right pr-2"># Files:</td>
                                <td class="font-weight-bold">{{ files.selected.length.toLocaleString() }}</td>
                              </tr>
                            </tbody>
                          </table>
                          <p class="mt-4 body-1 mb-0">
                            Files have passed validation checks. Please click <strong>Continue</strong>.
                          </p>
                        </div>

                      </v-alert>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        v-else-if="!!files.error"
                      >
                        <div class="font-weight-bold body-1">File Validation Failed</div>
                        <div>{{ files.error }}</div>
                      </v-alert>

                      <v-row class="mt-8 mb-4 px-3">
                        <v-btn text class="mr-4 px-4" @click="step -= 1">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="nextFiles" :loading="files.loading" :disabled="!!files.error">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="cancelFiles">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- STEP 3: CONFIRM STATION -->
              <v-stepper-content step="3">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <div class="text-h6">Confirm Station</div>
                    <p>Please confirm that these photos are for the correct station. If you previously uploaded photos for this station, then the last photo from the previous upload will be displayed for comparison. This will ensure that the new photos are for the same location.</p>

                    <v-alert
                      type="error"
                      text
                      colored-border
                      border="left"
                      class="body-2 mb-0 mt-4"
                      v-if="!files.selected || files.selected.length === 0"
                    >
                      <div class="font-weight-bold body-1">Missing Photo Files</div>
                      <div>
                        Photos have not been selected. Please return to previous step and select the files.
                      </div>
                    </v-alert>
                    <div v-else>
                      <v-card outlined class="mt-4">
                        <v-card-text class="black--text">
                          <div class="font-weight-bold">Station Name:</div>
                          <div>{{ station.name }}</div>
                          <v-row class="mt-4">
                            <v-col cols="12" sm="6">
                              <div class="font-weight-bold">Preview of First New Photo:</div>
                              <img :src="confirmStation.previewUrl" alt="Preview of first new photo" class="mt-2" style="max-width: 100%; max-height: 300px;" />
                            </v-col>
                            <v-col cols="12" sm="6">
                              <div class="font-weight-bold">Last Photo from Previous Upload:</div>
                              <img v-if="confirmStation.lastImageUrl" :src="confirmStation.lastImageUrl" alt="Last photo from previous upload" class="mt-2" style="max-width: 100%; max-height: 300px;" />
                              <div v-else class="mt-2">No photos have been uploaded for this station yet</div>
                              <div v-if="confirmStation.lastImageTimestamp" class="mt-2">
                                Timestamp: {{ confirmStation.lastImageTimestamp | formatTimestamp('local', 'DD t') }}
                              </div>
                            </v-col>
                          </v-row>
                        </v-card-text>
                      </v-card>

                      <p class="mt-4">If this is the correct station, please click "Continue".</p>
                    </div>

                    <v-row class="mt-8 mb-4 px-3">
                      <v-btn text class="mr-4 px-4" @click="step -= 1">
                        <v-icon left>mdi-chevron-left</v-icon> Previous
                      </v-btn>
                      <v-btn color="primary" class="mr-4 px-4" @click="nextConfirmStation">
                        Continue <v-icon right>mdi-chevron-right</v-icon>
                      </v-btn>

                      <v-spacer></v-spacer>

                      <v-btn text @click="$router.push({ name: 'manageImagesets' })">
                        Cancel
                      </v-btn>
                    </v-row>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- STEP 4: TIMESTAMP -->
              <v-stepper-content step="4">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <v-form ref="timestampForm">
                      <div class="text-h6">Configure Timestamp</div>

                      <ul class="mt-2 body-2">
                        <li>
                          The timestamp of each photo will be automatically extracted from the embedded EXIF data.
                        </li>
                        <li>
                          However, most cameras do not store timezone or daylight savings information. Therefore, we need to know which timezone the camera was set to.
                        </li>
                        <li>
                          Because most cameras do not automatically adjust for daylight savings time, we assume all photos in this batch are based on the same UTC offset (# hours from GMT).
                        </li>
                        <li>
                          If you are unsure whether your camera was set to local standard time (e.g. EST) or local daylight savings time (e.g. EDT), then use whichever one was occurring at the start of the deployment (assuming you set the time on the camera just prior to deploying it). If the deployment started in winter, choose the local standard time. If it started in summer, choose the local daylight savings time.
                        </li>
                      </ul>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                        v-if="!files.selected || files.selected.length === 0"
                      >
                        <div class="font-weight-bold body-1">Missing Photo Files</div>
                        <div>
                          Photos have not been selected. Please return to previous step and select the files.
                        </div>
                      </v-alert>
                      <div v-else>
                        <v-select
                          v-model="timestamp.utcOffset.selected"
                          :items="timestamp.utcOffset.options"
                          :rules="timestamp.utcOffset.rules"
                          item-text="label"
                          outlined
                          label="Select UTC Offset"
                          return-object
                          class="mb-2 mt-8"
                          @change="selectUtcOffset"
                        ></v-select>

                        <v-alert
                          type="error"
                          text
                          colored-border
                          border="left"
                          class="body-2 mb-0 mt-4"
                          v-if="!!timestamp.error"
                        >
                          <div class="font-weight-bold body-1">Failed to Validate Timestamp</div>
                          <div>
                            {{timestamp.error}}
                          </div>
                        </v-alert>
                        <v-alert
                          type="success"
                          text
                          colored-border
                          border="left"
                          class="body-2 mb-0"
                          v-else-if="timestamp.verify"
                        >
                          <div class="font-weight-bold body-1">Verify Photo Timestamp</div>
                          <p>The timestamp from the first photo has been extracted from the EXIF data and adjusted for the selected UTC offset. Please verify that the timestamps below are correct.</p>
                          <div>
                            <img :src="timestamp.verify.url" alt="Preview photo" width="500" />
                          </div>
                          <div class="mt-4">
                            <table>
                              <tbody>
                                <tr>
                                  <td class="text-right pr-2" style="width:140px">Filename:</td>
                                  <td class="font-weight-bold">{{ timestamp.verify.file.name }}</td>
                                </tr>
                                <tr>
                                  <td class="text-right pr-2" style="width:140px;vertical-align:top">EXIF Timestamp:</td>
                                  <td class="font-weight-bold">
                                    {{ timestamp.verify.exifTimestamp }}
                                    <br>
                                    <span class="text-caption font-italic">Extracted from EXIF data, should match timestamp shown on photo.</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td class="text-right pr-2" style="width:140px;vertical-align:top">UTC Timestamp:</td>
                                  <td class="font-weight-bold">
                                    {{ timestamp.verify.utcTimestamp }}
                                    <br>
                                    <span class="text-caption font-italic">Adjusted by the selected UTC offset ({{-1 * timestamp.utcOffset.selected.value}} hours).</span>
                                  </td>
                                </tr>
                                <tr>
                                  <td class="text-right pr-2" style="width:140px;vertical-align:top">Local Timestamp:</td>
                                  <td class="font-weight-bold">
                                    {{ timestamp.verify.localTimestamp }}
                                    <br>
                                    <span class="text-caption font-italic">
                                      Converted to the local timezone of this station ({{ station.timezone }}).<br>
                                      Note this timestamp will properly observe daylight savings time, and thus may differ from the EXIF timestamp and the timestamp shown in the photo.
                                    </span>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <p class="mt-4 body-1 mb-0">
                              If this information looks correct, click <strong>Continue</strong>.
                            </p>
                          </div>
                        </v-alert>
                      </div>

                      <v-row class="mt-8 mb-4 px-3" ref="timestampButtons">
                        <v-btn text class="mr-4 px-4" @click="step -= 1">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="nextTimestamp()">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageImagesets' })">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- STEP 5: ADDITIONAL INFO -->
              <v-stepper-content step="5">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <v-form ref="metadataForm">
                      <div class="text-h6">Additional Information</div>
                      <div>
                        Provide additional information about these photos.
                      </div>
                      <ul class="mt-2 body-2">
                        <li>What was the make/model of the camera?</li>
                        <li>Were there any problems during this deployment?</li>
                        <li>Were there any deviations from the general methodology defined for this station?</li>
                      </ul>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                        v-if="!files.selected || files.selected.length === 0"
                      >
                        <div class="font-weight-bold body-1">Missing Photo Files</div>
                        <div>
                          Photo files have not been selected. Please return to previous step and select the files.
                        </div>
                      </v-alert>
                      <div v-else>
                        <v-textarea
                          name="input-description"
                          label="Description (optional)"
                          v-model="metadata.description"
                          outlined
                          hide-details
                          class="mt-8"
                        ></v-textarea>
                      </div>

                      <v-row class="mt-8 mb-4 px-3">
                        <v-btn text class="mr-4 px-4" @click="step -= 1">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="nextMetadata()">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageImagesets' })">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- STEP 6: FINISH -->
              <v-stepper-content step="6">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <div class="text-h6">Ready to Upload</div>
                    <p>
                      Please review the following information. Then click Start Uploading to upload these photos.
                    </p>
                    <p>By checking the box below, you agree that these photos:</p>
                    <ul>
                      <li>May be publicly displayed on the Flow Photo Explorer and are not subject to copyright restrictions unless this station is marked as private, in which case the photos will not be shown publicly</li>
                      <li>May be used by the Flow Photo Explorer project team and our collaborators to develop machine learning models for predicting streamflow/stage based on stream photos</li>
                    </ul>
                    <v-checkbox label="I agree" v-model="upload.agree"></v-checkbox>

                    <v-alert
                      type="info"
                      text
                      colored-border
                      border="left"
                      class="body-2 mb-0 mt-4"
                      v-if="files.selected && files.selected.length >= 1000"
                    >
                      <div class="font-weight-bold body-1">This might take a while!</div>
                      <div>
                        Uploading thousands of photos could take an hour or more. Be prepared to leave this browser tab open until uploading is complete. Also, make sure your computer does not go to sleep by changing your power/energy settings.
                      </div>
                    </v-alert>

                    <v-row class="mt-8 mb-4 px-3">
                      <v-btn text class="mr-4 px-4" @click="backUpload()" :disabled="upload.status === 'PENDING'">
                        <v-icon left>mdi-chevron-left</v-icon> Previous
                      </v-btn>
                      <v-btn color="primary" class="mr-4 px-4" @click="startUpload" :loading="upload.status === 'PENDING'" :disabled="upload.status === 'DONE' || !upload.agree">
                        Start Upload <v-icon right>mdi-upload</v-icon>
                      </v-btn>

                      <v-spacer></v-spacer>

                      <v-btn text @click="cancelUpload">
                        Cancel
                      </v-btn>
                    </v-row>

                    <v-divider class="my-8" v-if="upload.status !== 'READY'"></v-divider>

                    <div v-if="upload.status === 'PENDING'" ref="pending">
                      <div class="mb-4 font-weight-bold">
                        {{upload.message}}
                      </div>
                      <v-progress-linear
                        :active="true"
                        color="primary"
                        height="8"
                        :value="upload.progress"
                      ></v-progress-linear>
                      <div
                        class="text-right body-2"
                        v-if="upload.remainingMinutes !== null"
                      >
                        <span v-if="upload.remainingMinutes > 1">
                          {{ upload.remainingMinutes.toFixed(1) }} minutes
                        </span>
                        <span v-else>
                          {{ (upload.remainingMinutes * 60).toFixed(0) }} seconds
                        </span>
                        remaining
                      </div>
                      <div class="text-right body-2" v-else>
                        Calculating remaining time...
                      </div>
                      <v-alert
                        type="warning"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold body-1">Upload in Progress</div>
                        <div>
                          Please leave this browser tab open and keep your computer awake until uploading is complete.
                        </div>
                      </v-alert>
                    </div>
                    <div v-else-if="upload.status === 'FAILED'">
                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold body-1">Upload Failed</div>
                        <div>
                          {{ upload.message }}
                        </div>
                        <div class="my-2 font-weight-bold">
                          {{ upload.error }}
                        </div>
                        <div class="mt-4">
                          <v-btn color="primary" class="mr-4" @click="startUpload"><v-icon left>mdi-refresh</v-icon> Retry</v-btn>
                          <v-btn color="success" class="mx-4" @click="finishUpload"><v-icon left>mdi-check</v-icon> Finish</v-btn>
                          <v-btn color="error" class="ml-4" @click="cancelUpload"><v-icon left>mdi-delete</v-icon> Cancel</v-btn>
                        </div>
                      </v-alert>
                    </div>
                    <div v-else-if="upload.status === 'DONE'">
                      <v-alert
                        type="success"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold body-1">Upload Complete!</div>
                        <div>
                          Photos have been uploaded and will now be queued for processing on the server.
                        </div>
                        <div class="mt-2">
                          Redirecting you back to the photo sets table for this station in 5 seconds, or <router-link :to="{name: 'manageImagesets'}">click here</router-link>.
                        </div>
                      </v-alert>
                    </div>
                    <div v-else-if="upload.status === 'CANCELLED'">
                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold body-1">Upload Cancelled</div>
                        <div>
                          Photos that have been uploaded will be deleted.
                        </div>
                        <div class="mt-2">
                          Redirecting you back to your existing photo sets in 5 seconds, or <router-link :to="{name: 'manageImagesets'}">click here</router-link>.
                        </div>
                      </v-alert>
                    </div>
                  </v-col>
                </v-row>
              </v-stepper-content>
            </v-stepper-items>
          </v-stepper>
        </v-card>
      </v-col>
    </v-row>
    <div ref="bottom"></div>
  </v-container>
</template>

<script>
import ExifParser from 'exif-parser'

import { utcOffsets, MAX_IMAGES_PER_IMAGESET } from '@/lib/constants'

export default {
  name: 'NewImageset',
  data () {
    return {
      timeout: null,
      step: 1,
      files: {
        loading: false,
        error: null,
        selected: null,
        rules: [
          v => v === null || v.length > 0 || 'No files selected'
        ],
        progress: 0,
        message: null,
        valid: false,
        cancelled: false
      },
      confirmStation: {
        previewUrl: null,
        lastImageUrl: null,
        lastImageTimestamp: null
      },
      timestamp: {
        error: null,
        utcOffset: {
          options: utcOffsets,
          selected: null,
          rules: [
            v => !!v || 'UTC offset is required'
          ]
        },
        verify: null
      },
      metadata: {
        error: null,
        description: null
      },
      upload: {
        imageset: null,
        presignedUrl: null,
        agree: false,
        error: null,
        status: 'READY',
        message: 'Ready to upload',
        progress: 0,
        remainingMinutes: null,
        index: null,
        lastFile: null,
        lastImage: null
      }
    }
  },
  computed: {
    stationId () {
      return this.$route.params.stationId
    },
    station () {
      return this.$parent.$parent.station
    }
  },
  beforeDestroy () {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    if (this.upload.status !== 'DONE') {
      this.deleteImageset()
    }
  },
  methods: {
    readImageFile (file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          return resolve(reader.result)
        }
        reader.onerror = (err) => {
          return reject(err)
        }
        reader.readAsArrayBuffer(file)
      })
    },
    async extractExifData (file) {
      const buffer = await this.readImageFile(file)
      const parser = ExifParser.create(buffer)
      return parser.enableSimpleValues(true).parse()
    },
    async validateExifData (file) {
      let exif
      try {
        exif = await this.extractExifData(file)
      } catch (err) {
        console.error(err)
        throw new Error(`Failed to extract EXIF data from first file (${file.name})`)
      }

      if (!exif.tags || Object.keys(exif.tags).length === 0) {
        throw new Error(`Photo file (${file.name}) does not have valid EXIF data`)
      }

      if (!exif.tags.DateTimeOriginal && !exif.tags.CreateDate) {
        throw new Error(`Photo file (${file.name}) is missing timestamp (DateTimeOriginal or CreateDate) in EXIF data`)
      }

      return exif
    },
    async validateImageFile (file) {
      // return new Promise((resolve, reject) => {
      if (!file) throw new Error('File not found')

      const fileExtension = file.name.split('.').pop().toLowerCase()
      if (!['jpg', 'jpeg'].includes(fileExtension)) {
        throw new Error(`${file.name} is not a valid file. All files must be in JPEG format with extension '.jpg' or '.jpeg'.`)
      }

      return await this.validateExifData(file)
    },
    resetFiles () {
      this.files.error = null
      this.files.loading = false
      this.files.message = null
      this.files.progress = 0
      this.files.valid = false
    },
    async validateFiles () {
      const files = this.files.selected

      if (files === null) {
        throw new Error('No files selected.')
      }

      if (files.length === 0) return

      if (files.length > MAX_IMAGES_PER_IMAGESET) {
        throw new Error(`The number of files selected (${files.length.toLocaleString()}) exceeds the maximum allowed per set (${MAX_IMAGES_PER_IMAGESET.toLocaleString()}). Please upload these files in smaller batches.`)
      }

      for (let i = 0; i < files.length; i++) {
        if (this.files.cancelled) return
        this.files.message = `Validating ${files[i].name}...`
        this.files.progress = i / files.length * 100
        await this.validateImageFile(files[i])
      }

      this.files.valid = true
    },
    async selectFiles () {
      this.resetFiles()

      this.files.loading = true
      try {
        await this.validateFiles()
      } catch (err) {
        this.files.error = err.toString()
        this.files.valid = false
        console.error(err)
      }

      this.files.loading = false
    },
    async nextFiles () {
      if (!this.$refs.fileForm.validate()) return

      if (this.files.error) return

      // Generate preview for the first image
      if (this.files.selected && this.files.selected.length > 0) {
        const firstFile = this.files.selected[0]
        this.confirmStation.previewUrl = URL.createObjectURL(firstFile)
      }

      // Fetch the last image from the most recent imageset
      await this.fetchLastImage()

      this.step += 1
    },
    cancelFiles () {
      this.files.cancelled = true
      this.$router.push({ name: 'manageImagesets' })
    },
    resetTimestamp () {
      this.timestamp.utcOffset.selected = null
      this.timestamp.error = null
      this.timestamp.verify = null
    },
    async selectUtcOffset () {
      this.timestamp.verify = null
      this.timestamp.error = null
      if (!this.timestamp.utcOffset.selected) return

      if (!this.files.selected || !this.files.selected.length === 0) {
        this.timestamp.error = 'No files could be loaded. Please return to the previous step and select the photo files.'
      }

      const file = this.files.selected[0]
      const url = URL.createObjectURL(file)

      let exif
      try {
        exif = await this.validateExifData(file)
      } catch (err) {
        this.timestamp.error = err.toString()
      }

      const exifDatetime = exif.tags.DateTimeOriginal || exif.tags.CreateDate
      const rawTimestamp = new Date(exifDatetime * 1000)
      const utcOffset = this.timestamp.utcOffset.selected
      const timestamp = this.$luxon.DateTime.fromJSDate(rawTimestamp).setZone(utcOffset.id, { keepLocalTime: true })
      if (!timestamp.isValid) return 'Invalid Date'

      console.log(timestamp)

      const exifTimestamp = timestamp.toFormat('DD tt')
      const localTimestamp = timestamp.setZone(this.station.timezone).toFormat('DD ttt')
      const utcTimestamp = timestamp.setZone('UTC').toFormat('DD ttt')

      this.timestamp.verify = {
        file,
        url,
        ...exif.imageSize,
        exifTimestamp,
        localTimestamp,
        utcTimestamp
      }

      setTimeout(() => this.$vuetify.goTo(this.$refs.bottom), 100)
    },
    nextTimestamp () {
      if (!this.$refs.timestampForm.validate()) return

      if (!this.files.selected || this.files.selected.length === 0) {
        this.timestamp.error('No files selected. Please return to previous step and select the photo files.')
        return
      }

      if (this.timestamp.error) return

      this.step += 1
    },
    nextMetadata () {
      if (!this.$refs.metadataForm.validate()) return

      if (!this.files.selected || this.files.selected.length === 0) return

      this.step += 1
    },
    resetUpload () {
      this.upload.status = 'READY'
      this.upload.error = null
    },
    backUpload () {
      this.resetUpload()
      this.step -= 1
    },
    validateUpload () {
      if (!this.files.selected || this.files.selected.length === 0) {
        this.upload.status = 'FAILED'
        this.upload.error = 'No files have been selected'
        return false
      }

      if (!this.timestamp.utcOffset.selected) {
        this.upload.status = 'FAILED'
        this.upload.error = 'Timezone has not been specified. Please go back to step 3.'
        return false
      }

      return true
    },
    cancelUpload () {
      this.upload.status = 'CANCELLED'

      this.timeout = setTimeout(() => {
        this.$router.push({
          name: 'manageImagesets'
        })
      }, 5000)
    },
    async startUpload () {
      const startedAt = new Date()

      if (!this.validateUpload()) return

      this.upload.status = 'PENDING'
      this.upload.message = 'Starting upload...'

      this.$nextTick(() => this.$vuetify.goTo(this.$refs.pending))

      const files = this.files.selected

      if (!this.upload.imageset) {
        try {
          this.upload.imageset = await this.createImageset()
        } catch (err) {
          console.error(err)
          this.upload.status = 'FAILED'
          this.upload.message = 'Failed to create photo set'
          this.upload.error = (err.response && err.response.data.message) || err.toString()
          return
        }
      }

      if (this.upload.imageset.status !== 'UPLOADING') {
        try {
          await this.updateImagesetStatus('UPLOADING')
        } catch (err) {
          console.error(err)
          this.upload.status = 'FAILED'
          this.upload.message = 'Failed to start uploading photos'
          this.upload.error = (err.response && err.response.data.message) || err.toString()
          return
        }
      }

      try {
        this.upload.presignedUrl = await this.getPresignedUrl()
      } catch (err) {
        console.error(err)
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to start uploading photos'
        this.upload.error = (err.response && err.response.data.message) || err.toString()
        return
      }

      const n = files.length
      const times = []
      const startIndex = this.upload.index || 0

      for (let i = startIndex; i < n; i++) {
        const start = new Date()
        const file = files[i]

        this.upload.message = `Uploading ${file.name} (${(i + 1).toLocaleString()} of ${n.toLocaleString()})...`
        this.upload.progress = (i / n) * 100
        this.upload.index = i

        try {
          this.upload.lastFile = await this.uploadFileToS3(file, i)
          this.upload.lastImage = await this.createImage(this.upload.lastFile)
        } catch (err) {
          console.error(err.response || err)

          if (this.upload.status === 'CANCELLED') return

          this.upload.status = 'FAILED'
          this.upload.message = `Failed to upload photo: ${file.name}. Press Retry to continue trying to upload this photo set, Finish to stop uploading and skip the remaining photos (previously uploaded photos will be saved), or Cancel to delete this photo set entirely including all previously uploaded images from the server.`
          this.upload.error = (err.response && err.response.data.message) || err.toString()

          return
        }

        const time = (new Date() - start)
        if (times.length > 100) times.shift()
        times.push(time)
        const totaTime = times.reduce((p, v) => p + v, 0)
        const rate = totaTime / 1000 / 60 / times.length // min/image
        this.upload.remainingMinutes = rate * (n - i - 1)
      }

      const endedAt = new Date()
      const duration = ((endedAt - startedAt) / 1000 / 60)
      console.log(`elapsed time: ${duration.toFixed(1)} minutes`)

      await this.finishUpload()
    },
    async finishUpload () {
      try {
        await this.processImageset()
      } catch (err) {
        console.error(err.response || err)

        if (this.upload.status === 'CANCELLED') return

        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to start processing photos. The photos have been saved to the server, but will need to be manually processed. Please contact us for help.'
        this.upload.error = (err.response && err.response.data.message) || err.toString()

        return
      }

      this.upload.status = 'DONE'
      this.upload.message = 'Upload complete'

      this.timeout = setTimeout(() => {
        this.$router.push({
          name: 'manageImageset',
          params: {
            imagesetId: this.upload.imageset.id
          }
        })
      }, 5000)
    },
    async createImage (uploadedFile) {
      const payload = {
        full_s3: uploadedFile.s3,
        full_url: `https://${uploadedFile.s3.Bucket}.s3.amazonaws.com/${uploadedFile.s3.Key}`,
        filename: uploadedFile.filename
      }

      const response = await this.$http.restricted.post(
        `/stations/${this.stationId}/imagesets/${this.upload.imageset.id}/images`,
        payload
      )
      return response.data
    },
    async createImageset () {
      const payload = {
        config: {
          timestamp: {
            utcOffset: this.timestamp.utcOffset.selected.value
          }
        },
        metadata: {
          description: this.metadata.description
        }
      }

      const response = await this.$http.restricted.post(
        `/stations/${this.stationId}/imagesets`,
        payload
      )

      return response.data
    },
    async getPresignedUrl () {
      const response = await this.$http.restricted.get(
        `/stations/${this.stationId}/imagesets/${this.upload.imageset.id}/presigned`
      )

      return response.data
    },
    async updateImagesetStatus (status) {
      if (!this.upload.imageset) return
      return await this.$http.restricted.put(
        `/stations/${this.upload.imageset.station_id}/imagesets/${this.upload.imageset.id}`,
        { status }
      )
    },
    async processImageset () {
      if (!this.upload.imageset) return
      return await this.$http.restricted.post(
        `/stations/${this.upload.imageset.station_id}/imagesets/${this.upload.imageset.id}/process`,
        null
      )
    },
    async deleteImageset () {
      if (!this.upload.imageset) return
      try {
        await this.$http.restricted.delete(
          `/stations/${this.upload.imageset.station_id}/imagesets/${this.upload.imageset.id}`
        )
      } catch (err) {
        console.log(`Failed to delete imageset (id=${this.upload.imageset.id})`)
        console.error(err)
      }
    },
    async uploadFileToS3 (file, i) {
      const formData = new FormData()

      const s3Key = this.upload.presignedUrl.fields.key + file.name

      Object.keys(this.upload.presignedUrl.fields).forEach((key) => {
        if (key === 'key') {
          formData.append(key, s3Key)
        } else {
          formData.append(key, this.upload.presignedUrl.fields[key])
        }
      })
      formData.append('file', file)

      const response = await this.$http.retry({
        method: 'post',
        url: this.upload.presignedUrl.url,
        data: formData,
        raxConfig: {
          retry: 3,
          statusCodesToRetry: [[100, 199], [400, 429], [500, 599]],
          onRetryAttempt: err => {
            console.log('retrying s3 upload (%s)', s3Key)
            console.log(err)
          }
        }
      })
      return {
        filename: file.name,
        s3: {
          Bucket: this.upload.presignedUrl.fields.bucket,
          Key: s3Key
        },
        response: response
      }
    },
    async fetchLastImage () {
      try {
        // Fetch imagesets
        const imagesetResponse = await this.$http.restricted.get(`/stations/${this.stationId}/imagesets`)
        const imagesets = imagesetResponse.data.filter(imageset => imageset.status === 'DONE')

        if (imagesets.length === 0) {
          console.log('No existing imagesets found')
          return
        }

        // Find the most recent imageset
        const mostRecentImageset = imagesets.reduce((latest, current) => {
          return new Date(current.created_at) > new Date(latest.created_at) ? current : latest
        })

        // Fetch the last image of the most recent imageset
        const lastImageResponse = await this.$http.restricted.get(`/stations/${this.stationId}/imagesets/${mostRecentImageset.id}/last-image`)
        const lastImage = lastImageResponse.data

        this.confirmStation.lastImageUrl = lastImage.full_url
        this.confirmStation.lastImageTimestamp = lastImage.timestamp
      } catch (error) {
        console.error('Error fetching last image:', error)
      }
    },
    nextConfirmStation () {
      if (!this.files.selected || this.files.selected.length === 0) {
        this.confirmStation.error = 'No files selected. Please return to previous step and select the photo files.'
        return
      }

      this.resetTimestamp()
      this.step += 1
    }
  }
}
</script>
