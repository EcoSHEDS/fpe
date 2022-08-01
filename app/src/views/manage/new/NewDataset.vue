<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="2">
          <v-card-title primary-title>
            <div class="text-h5">Upload Data File</div>
          </v-card-title>
          <v-stepper v-model="step">
            <v-stepper-header>
              <v-stepper-step
                :complete="step > 1"
                step="1">
                Instructions
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                :complete="step > 2"
                step="2">
                File
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                :complete="step > 3"
                step="3">
                Timestamps
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                :complete="step > 4"
                step="4">
                Values
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step
                :complete="step > 5"
                step="5">
                Additional Info
              </v-stepper-step>

              <v-divider></v-divider>

              <v-stepper-step step="6">
                Finish
              </v-stepper-step>
            </v-stepper-header>

            <v-stepper-items class="body-1">
              <!-- INSTRUCTIONS -->
              <v-stepper-content step="1">
                <v-row justify="space-around">
                  <v-col cols="12" md="8" class="body-1">
                    <div class="text-h6">Instructions</div>
                    <p>Use this form to upload a new file containing streamflow and/or stage data.</p>
                    <div class="font-weight-bold">Requirements</div>
                    <ul class="body-2 mt-2">
                      <li><strong>File must contain continuous data at hourly (or greater) frequency</strong>. Please do not upload daily data.</li>
                      <li><strong>File must be in comma-separated values (CSV) format</strong> with the first non-commented row (see next point) containing the column names.</li>
                      <li><strong>First one or more rows may contain comments</strong>. Comment rows must start with a '#' symbol to distinguish them from the first row of column names.</li>
                      <li><strong>Dates and times may be one single column or two separate columns</strong>. If dates and times are in separate columns, the values will be merged together separated by a space to create a complete timestamp.</li>
                      <li><strong>A optional column of flags may be included</strong> for each variable (flow or stage). If no flags are included, we assume all data have undergone QAQC review. Only include flags indicating erroneous or abnormal data. Any rows having a flag of any kind will be ignored. Conversely, rows without any flags are assumed to contain reasonably accurate data.</li>
                      <li><strong>File may contain additional columns, which will be ignored.</strong></li>
                    </ul>

                    <v-row class="mt-8 mb-4 px-3">
                      <v-btn text class="mr-4 px-4" :disabled="true">
                        <v-icon left>mdi-chevron-left</v-icon> Previous
                      </v-btn>
                      <v-btn color="primary" class="mr-4 px-4" @click="step += 1">
                        Continue <v-icon right>mdi-chevron-right</v-icon>
                      </v-btn>

                      <v-spacer></v-spacer>

                      <v-btn text @click="$router.push({ name: 'manageDatasets' })">
                        Cancel
                      </v-btn>
                    </v-row>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- FILE -->
              <v-stepper-content step="2">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <v-form ref="fileForm">
                      <div class="text-h6">Select Dataset File</div>

                      <ul class="mt-2 body-2">
                        <li><strong>File must be in comma-separated values (CSV) format</strong> with the first non-commented row (see next point) containing the column names.</li>
                        <li><strong>First one or more rows may contain comments</strong>. Comment rows must start with a '#' symbol to distinguish them from the first row of column names.</li>
                      </ul>

                      <v-file-input
                        v-model="file.selected"
                        :rules="file.rules"
                        label="Select a CSV file"
                        truncate-length="200"
                        @change="selectFile"
                        class="mt-8"
                        ref="fileInput"
                      >
                      </v-file-input>
                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                        :value="file.status === 'ERROR' && !!file.error"
                      >
                        <div class="font-weight-bold body-1">{{ file.error }}</div>
                      </v-alert>
                      <v-alert
                        type="success"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        v-if="file.status === 'SUCCESS'"
                      >
                        <div class="font-weight-bold body-1">File successfuly loaded</div>
                        <div class="mt-4">
                          <table>
                            <tbody>
                              <tr>
                                <td class="text-right pr-2">Filename:</td>
                                <td class="font-weight-bold">{{ file.selected.name }}</td>
                              </tr>
                              <tr>
                                <td class="text-right pr-2">Filesize:</td>
                                <td class="font-weight-bold">{{ file.selected.size | prettyBytes(1) }}</td>
                              </tr>
                              <tr>
                                <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                                <td class="font-weight-bold">
                                  <span v-for="(field, i) in columnOptions" :key="i">"{{ field }}"<br></span>
                                </td>
                              </tr>
                              <tr>
                                <td class="text-right pr-2"># Rows:</td>
                                <td class="font-weight-bold">{{ file.parsed.data.length.toLocaleString() }}</td>
                              </tr>
                            </tbody>
                          </table>
                          <p class="mt-4 body-1 mb-0">
                            If this information looks correct, click <strong>Continue</strong>.
                          </p>
                        </div>
                      </v-alert>

                      <v-row class="mt-8 mb-4 px-3">
                        <v-btn text class="mr-4 px-4" @click="step -= 1">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="nextFile" :loading="file.loading">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageDatasets' })">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- TIMESTAMPS -->
              <v-stepper-content step="3">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <v-form ref="timestampForm">
                      <div class="text-h6">Configure Timestamp Column</div>

                      <ul class="mt-2 body-2">
                        <li>
                          <strong>Dates and times may be one single column or two separate columns</strong>. If dates and times are in separate columns, the values will be merged together separated by a space to create a complete timestamp.
                        </li>
                        <li>
                          <strong>The timezone of the dates and times must be specified as a constant UTC offset (number of hours from UTC/GMT).</strong> If this data was collected using a logger, then this will depend on when the time was set on the logger. Most loggers do not automatically adjust for daylight savings time, and thus timestamps in the file are expected to all be in the same UTC offset.
                        </li>
                        <li>
                          If you are unsure whether your logger was set to standard local time (e.g. EST) or daylight savings time (e.g. EDT), use whichever one was occurring at the start of the deployment (assuming you set the time on the logger just prior to deploying it).
                        </li>
                      </ul>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                        v-if="!file.selected"
                      >
                        <div class="font-weight-bold body-1">Missing Dataset File</div>
                        <div>
                          Dataset file has not been selected. Please return to previous step and select a file.
                        </div>
                      </v-alert>

                      <v-container v-else>
                        <v-checkbox
                          v-model="timestamp.hasTimeColumn"
                          outlined
                          label="Dates and times are in separate columns"
                        ></v-checkbox>
                        <v-select
                          v-model="timestamp.column.selected"
                          :items="columnOptions"
                          :rules="timestamp.column.rules"
                          outlined
                          :label="timestamp.hasTimeColumn ? 'Select date column' : 'Select the date/time column'"
                          :hint="timestamp.hasTimeColumn ? 'Select the column containing only the dates' : 'Select the column containing the dates and times'"
                          persistent-hint
                        ></v-select>
                        <v-select
                          v-if="timestamp.hasTimeColumn"
                          v-model="timestamp.timeColumn.selected"
                          :items="columnOptions"
                          :rules="timestamp.timeColumn.rules"
                          outlined
                          label="Select time column"
                          hint="Select the column containing only the times"
                          persistent-hint
                        ></v-select>
                        <v-select
                          v-model="timestamp.utcOffset.selected"
                          :items="timestamp.utcOffset.options"
                          :rules="timestamp.utcOffset.rules"
                          item-text="label"
                          outlined
                          label="Select timezone (UTC offset)"
                          hint="Select the UTC offset of the date/timestamps"
                          persistent-hint
                          return-object
                        ></v-select>
                      </v-container>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        :value="!!timestamp.error"
                      >
                        <div class="font-weight-bold body-1">{{ timestamp.error }}</div>
                      </v-alert>

                      <v-alert
                        type="info"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0"
                        v-if="!timestamp.error &&
                              file.parsed &&
                              (file.parsed.data.length > 0) &&
                              timestamp.column.selected &&
                              timestamp.utcOffset.selected &&
                              (!timestamp.hasTimeColumn || timestamp.timeColumn.selected)"
                      >
                        <div class="font-weight-bold body-1">Verify Parsed Timestamp</div>
                        <div class="font-weight-bold">Check that the timestamp in the first row ("Raw Value") was correctly parsed. <span v-if="timestamp.hasTimeColumn">The date and time columns have been combined to create a single timestamp.</span></div>
                        <table>
                          <tbody>
                            <tr>
                              <td class="text-right px-4" style="vertical-align:top">Raw Value:</td>
                              <td class="font-weight-bold">
                                "{{ firstTimestampValue }}"
                                <br>
                                <span class="text-caption font-italic">Extracted from first row of file.</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="text-right px-4" style="vertical-align:top">UTC Timestamp:</td>
                              <td class="font-weight-bold">
                                {{ parseTimestamp(firstTimestampValue) ? `${parseTimestamp(firstTimestampValue).format('MMM D, YYYY h:mm:ss a')} UTC` : 'Invalid Date' }}
                                <br>
                                <span class="text-caption font-italic">Adjusted by the selected UTC offset ({{-1 * timestamp.utcOffset.selected.value}} hours).</span>
                              </td>
                            </tr>
                            <tr>
                              <td class="text-right px-4" style="vertical-align:top">Local Timestamp:</td>
                              <td class="font-weight-bold">
                                {{ parseTimestamp(firstTimestampValue, true) ? parseTimestamp(firstTimestampValue, true).format('MMM D, YYYY h:mm:ss a z') : 'Invalid Date' }}
                                <br>
                                <span class="text-caption font-italic">Converted to the local timezone of this station ({{ station.timezone }}).</span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        <p class="body-2 mt-4 mb-0">
                          If these do not look correct, please try a different timestamp format such as "YYYY-mm-dd HH:MM:SS". In Excel, select the timestamp column, go to Format > Cells, select Custom category and enter "YYYY-mm-dd HH:MM:SS" as the type. Then re-save the file in CSV format.
                        </p>
                      </v-alert>

                      <v-row class="mt-8 mb-4 px-3">
                        <v-btn text class="mr-4 px-4" @click="step -= 1">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="nextTimestamp">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageDatasets' })">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- VALUES -->
              <v-stepper-content step="4">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <v-form ref="valuesForm">
                      <div class="text-h6">Configure Value Column(s)</div>
                      <ul class="mt-2 body-2">
                        <li>
                          <strong>Specify the column, units and flag column (optional) for each variable</strong>.
                        </li>
                        <li>
                          <strong>Multiple variables can be specified by clicking the "Add Variable" button.</strong>.
                        </li>
                        <li>
                          <strong>To remove a varible click the "Close" button.</strong>.
                        </li>
                        <li>
                          <strong>A optional column of flags may be included</strong> for each variable. If no flags are included, we assume all data have undergone QAQC review and are reasonably accurate. Only include flags indicating erroneous or abnormal data. Any rows having a flag of any kind will be ignored. Conversely, rows without any flags are assumed to contain reasonably accurate data. If you include flags, please specify the meaning of each flag type in the <strong>Data Source and Methdology</strong> for this station.
                        </li>
                      </ul>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                        v-if="!file.selected"
                      >
                        <div class="font-weight-bold body-1">Missing Dataset File</div>
                        <div>
                          Dataset file has not been selected. Please return to the second step and select a file.
                        </div>
                      </v-alert>

                      <v-container v-else class="mt-4">
                        <v-row v-for="(variable, i) in values.variables" :key="i">
                          <v-col cols="12">
                            <div class="elevation-2 pa-4">
                              <div class="text-h6 d-flex mb-0">
                                Variable #{{i + 1}}
                                <v-spacer></v-spacer>
                                <v-btn icon small @click="removeVariable(i)" :disabled="i === 0" v-if="i > 0">
                                  <v-icon>mdi-close</v-icon>
                                </v-btn>
                              </div>
                              <v-divider class="mb-4"></v-divider>
                              <v-row>
                                <v-col cols="12" md="6">
                                  <v-select
                                    v-model="variable.column.selected"
                                    :items="valuesColumnOptions"
                                    :rules="variable.column.rules"
                                    outlined
                                    label="Select column"
                                    @change="validateValues"
                                    clearable
                                  ></v-select>
                                </v-col>
                                <v-col cols="12" md="6">
                                  <v-select
                                    v-model="variable.variable.selected"
                                    :items="variableOptions"
                                    :rules="variable.variable.rules"
                                    outlined
                                    label="Select variable"
                                    @change="validateValues"
                                    item-text="label"
                                    return-object
                                    clearable
                                  ></v-select>
                                </v-col>
                              </v-row>
                              <v-row>
                                <v-col cols="12" md="6">
                                  <v-select
                                    v-model="variable.units.selected"
                                    :items="variable.variable.selected ? variable.variable.selected.unitOptions : []"
                                    :rules="variable.units.rules"
                                    item-text="label"
                                    outlined
                                    label="Select units"
                                    :hint="variable.variable.selected && variable.variable.selected.unitOptions.length > 1 ? `Note: values will be converted to ${variable.variable.selected.units}.`: null"
                                    :persistent-hint="!!variable.variable.selected"
                                    return-object
                                    clearable
                                  ></v-select>
                                </v-col>
                                <v-col cols="12" md="6">
                                  <v-select
                                    v-model="variable.flag.selected"
                                    :items="valuesColumnOptions"
                                    :rules="variable.flag.rules"
                                    outlined
                                    label="Select flag column (optional)"
                                    clearable
                                    hide-details
                                  ></v-select>
                                </v-col>
                              </v-row>
                              <v-row v-if="variable.variable.selected && variable.variable.selected.message">
                                <v-col cols="12">
                                  <Alert type="warning" class="font-weight-bold body-1 mb-0">{{ variable.variable.selected.message }}</Alert>
                                </v-col>
                              </v-row>
                            </div>
                          </v-col>
                        </v-row>
                        <v-row>
                          <v-col cols="12">
                            <v-btn color="primary" block outlined @click="addVariable">
                              <v-icon left>mdi-plus</v-icon> Add Variable
                            </v-btn>
                          </v-col>
                        </v-row>
                        <!-- <pre>{{ values.variables }}</pre> -->
                      </v-container>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 my-4"
                        :value="!!values.error"
                      >
                        <div class="font-weight-bold body-1">
                          {{ values.error }}
                        </div>
                      </v-alert>

                      <v-row class="mt-4 mb-4 px-3">
                        <v-btn text class="mr-4 px-4" @click="step -= 1">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="nextValues">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageDatasets' })">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- METADATA -->
              <v-stepper-content step="5">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <v-form ref="metadataForm">
                      <div class="text-h6">Additional Information</div>
                      <div>
                        Provide additional information about the data in this file.
                      </div>
                      <ul class="body-1 mt-2 body-2">
                        <li>Where there any notable hydrologic events during the collection of this data?</li>
                        <li>Where there any equipment failures or other issues with the data?</li>
                        <li>Were there any deviations from the <strong>Data Source and Methodology</strong> defined for this station?</li>
                      </ul>

                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                        v-if="!file.selected"
                      >
                        <div class="font-weight-bold body-1">Missing Dataset File</div>
                        <div>
                          Dataset file has not been selected. Please return to the second step and select a file.
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
                        <v-btn color="primary" class="mr-4 px-4" @click="nextMetadata">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageDatasets' })">
                          Cancel
                        </v-btn>
                      </v-row>
                    </v-form>
                  </v-col>
                </v-row>
              </v-stepper-content>

              <!-- UPLOAD -->
              <v-stepper-content step="6">
                <v-row justify="space-around">
                  <v-col cols="12" md="8">
                    <div class="text-h6">Ready to Upload</div>
                    <p>
                      Please agree to the following conditions. Then click <strong>Start Upload</strong> to upload this file.
                    </p>
                    <p>By checking the box below, you agree that the data in this file:</p>
                    <ul>
                      <li>May be publicly displayed on the Flow Photo Explorer unless this station is marked as private, in which case the photos will not be shown publicly</li>
                      <li>May be used by the Flow Photo Explorer project team and our collaborators to develop machine learning models for predicting streamflow/stage based on stream images</li>
                    </ul>
                    <v-checkbox label="I agree" v-model="upload.agree"></v-checkbox>

                    <v-row class="mt-4 mb-4 px-3">
                      <v-btn text class="mr-4 px-4" @click="backUpload()" :disabled="upload.status === 'PENDING'">
                        <v-icon left>mdi-chevron-left</v-icon> Previous
                      </v-btn>
                      <v-btn color="primary" class="mr-4 px-4" @click="startUpload()" :loading="upload.status === 'PENDING'" :disabled="upload.status === 'DONE' || !upload.agree">
                        <span v-if="!$vuetify.breakpoint.mobile">Start Upload</span><span v-else>Upload</span> <v-icon right>mdi-upload</v-icon>
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

                      <v-alert
                        type="warning"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold">Upload in Progress</div>
                        <div>
                          Please leave this browser tab open until uploading is complete.
                        </div>
                      </v-alert>
                    </div>
                    <div v-if="upload.status === 'FAILED'">
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
                        <div class="mt-2">
                          {{ upload.error }}
                        </div>
                      </v-alert>
                    </div>
                    <div v-if="upload.status === 'DONE'">
                      <v-alert
                        type="success"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold body-1">Upload Complete!</div>
                        <div>
                          The dataset has been uploaded and will now be queued for processing on the server.
                        </div>
                        <div class="mt-2">
                          Redirecting you back to the station files table in 5 seconds, or <router-link :to="{name: 'manageDatasets'}">click here</router-link>.
                        </div>
                      </v-alert>
                    </div>
                    <div v-if="upload.status === 'CANCELLED'">
                      <v-alert
                        type="error"
                        text
                        colored-border
                        border="left"
                        class="body-2 mb-0 mt-4"
                      >
                        <div class="font-weight-bold body-1">Upload Cancelled</div>
                        <div>
                          File upload has been cancelled. The file has been deleted from the server.
                        </div>
                        <div class="mt-2">
                          <router-link :to="{name: 'manageDatasets'}">Click here</router-link> to go back to the existing files for this station.
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
  </v-container>
</template>

<script>
import { parseFile } from '@/lib/parsers'
import { utcOffsets, variables } from '@/lib/constants'
import { mapGetters } from 'vuex'
import dayjs from 'dayjs'

export default {
  name: 'NewDataset',
  data () {
    return {
      timeout: null,
      step: 1,
      variableOptions: variables,
      file: {
        status: 'READY',
        loading: false,
        error: null,
        selected: null,
        parsed: null,
        rules: [
          v => {
            if (!v) return true
            const fileExtension = this.file.selected.name.split('.').pop().toLowerCase()
            if (fileExtension !== 'csv') {
              return 'File must be a comma-separated value (CSV) file with extension \'.csv\''
            }
            return true
          }
        ]
      },
      timestamp: {
        error: null,
        column: {
          selected: null,
          rules: [
            v => !!v || 'Timestamp column is required'
          ]
        },
        hasTimeColumn: false,
        timeColumn: {
          selected: null,
          rules: [
            v => !!v || !this.timestamp.hasTimeColumn || 'Time column is required'
          ]
        },
        utcOffset: {
          options: utcOffsets,
          selected: null,
          rules: [
            v => !!v || 'UTC offset is required'
          ]
        }
      },
      values: {
        error: null,
        variables: [
          {
            variable: {
              selected: null,
              rules: [
                v => !!v || 'Variable is required'
              ]
            },
            column: {
              selected: null,
              rules: [
                v => !!v || 'Column is required'
              ]
            },
            units: {
              selected: null,
              rules: [
                v => !!v || 'Units are required'
              ]
            },
            flag: {
              selected: null
            }
          }
        ]
      },
      metadata: {
        error: null,
        description: ''
      },
      upload: {
        loading: false,
        status: 'READY',
        message: 'Ready to upload',
        agree: false,
        progress: 0,
        dataset: null
      }
    }
  },
  computed: {
    ...mapGetters(['affiliation']),
    columnOptions () {
      return this.file.parsed ? this.file.parsed.meta.fields : []
    },
    valuesColumnOptions () {
      const excludeColumns = []
      if (this.timestamp.column.selected) {
        excludeColumns.push(this.timestamp.column.selected)
      }
      if (this.timestamp.hasTimeColumn && this.timestamp.timeColumn.selected) {
        excludeColumns.push(this.timestamp.timeColumn.selected)
      }
      return this.columnOptions.filter(d => !excludeColumns.includes(d))
    },
    stationId () {
      return this.$route.params.stationId
    },
    station () {
      return this.$parent.$parent.station
    },
    firstTimestampValue () {
      if (this.timestamp.error ||
        !this.file.parsed ||
        this.file.parsed.data.length === 0 ||
        !this.timestamp.column.selected ||
        !this.timestamp.utcOffset.selected ||
        (this.timestamp.hasTimeColumn && !this.timestamp.timeColumn.selected)
      ) {
        return null
      }
      const row = this.file.parsed.data[0]
      return this.timestamp.hasTimeColumn
        ? `${row[this.timestamp.column.selected]} ${row[this.timestamp.timeColumn.selected]}`
        : row[this.timestamp.column.selected]
    }
  },
  mounted () {
    if (this.station && this.station.metadata && this.station.metadata.dataSource) {
      this.metadata.attribution.value = this.station.metadata.dataSource.attribution
      this.metadata.methodology.value = this.station.metadata.dataSource.methodology
    }
  },
  beforeDestroy () {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
  },
  methods: {
    selectFile () {
      this.file.error = null
      this.file.parsed = null
      this.resetTimestamp()
      this.resetValues()
      this.resetMetadata()
      this.resetUpload()

      if (!this.$refs.fileForm.validate()) {
        this.file.status = 'ERROR'
        return
      }

      if (!this.file.selected) {
        this.file.status = 'ERROR'
        this.file.error = 'No file selected.'
        return
      }

      this.file.status = 'PENDING'
      this.file.loading = true

      parseFile(this.file.selected)
        .then(results => {
          this.$refs.fileInput.blur()
          if (results.errors.length > 0) {
            this.file.status = 'ERROR'
            const row = results.errors[0].row ? `(Row ${results.errors[0].row})` : ''
            this.file.error = `${results.errors[0].message} ${row}`
          }

          const fields = results.meta.fields
          if (!fields.every(d => d.length > 0)) {
            const index = fields.findIndex(d => d.length === 0) + 1
            this.file.status = 'ERROR'
            this.file.error = `File contains an unnamed column (column ${index}). Please remove this column or add a name to the first row.`
          }

          this.file.parsed = results
          this.file.status = 'SUCCESS'
        })
        .catch((e) => {
          this.file.status = 'ERROR'
          this.file.error = e.message || e.toString()
        })
        .finally(() => {
          this.file.loading = false
        })
    },
    nextFile () {
      if (!this.file.selected) {
        this.file.status = 'ERROR'
        this.file.error = 'No file selected.'
        return
      } else if (this.file.status !== 'SUCCESS') {
        this.file.status = 'ERROR'
        this.file.error = 'Unknown error occurred. Please try loading this file again.'
        return
      }
      this.step += 1
    },
    resetTimestamp () {
      this.timestamp.error = null
      this.timestamp.column.selected = null
      this.timestamp.hasTimeColumn = false
      this.timestamp.timeColumn.selected = null
      this.timestamp.utcOffset.selected = null
    },
    parseTimestamp (v, local) {
      if (!this.timestamp.utcOffset.selected) return 'Missing UTC offset'

      const utcOffset = this.timestamp.utcOffset.selected.value
      const parsed = dayjs(v).utc(true).subtract(utcOffset, 'hour')
      if (!parsed.isValid()) return 'Invalid Date'

      return local ? parsed.tz(this.station.timezone) : parsed
    },
    nextTimestamp () {
      this.timestamp.error = null

      if (!this.$refs.timestampForm.validate()) return

      if (!this.file.parsed) {
        this.timestamp.error = 'File was not loaded correctly. Please return to the previous step and try loading it again.'
        return
      }

      const row = this.file.parsed.data[0]

      if (!row) {
        this.timestamp.error = 'File appears to be empty, no rows found.'
        return
      }

      this.step += 1
    },
    resetValues () {
      this.values.error = null
      this.values.variables.forEach(d => {
        d.column.selected = null
        d.units.selected = null
      })
    },
    validateValues () {
      this.values.error = null
      return true
    },
    addVariable () {
      this.values.variables.push({
        variable: {
          selected: null,
          rules: [
            v => !!v || 'Variable is required'
          ]
        },
        column: {
          selected: null,
          rules: [
            v => !!v || 'Column is required'
          ]
        },
        units: {
          selected: null,
          rules: [
            v => !!v || 'Units are required'
          ]
        },
        flag: {
          selected: null
        }
      })
    },
    removeVariable (i) {
      this.values.variables.splice(i, 1)
    },
    nextValues () {
      this.values.error = null

      if (!this.$refs.valuesForm.validate()) return

      if (!this.validateValues()) return

      this.step += 1
    },
    resetMetadata () {
      this.metadata.error = null
      this.metadata.description = null
    },
    nextMetadata () {
      if (!this.$refs.metadataForm.validate()) return

      if (!this.file.selected || this.file.selected.length === 0) return

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
      return true
    },
    async startUpload () {
      this.status = 'Creating dataset...'

      if (!this.validateUpload()) return

      this.upload.status = 'PENDING'
      this.upload.message = 'Starting upload...'

      this.$nextTick(() => this.$vuetify.goTo(this.$refs.pending))

      try {
        this.upload.dataset = await this.createDataset()
      } catch (err) {
        console.error(err)
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to create dataset'
        this.upload.error = (err.response && err.response.data.message) || err.toString()
        return
      }

      const file = this.file.selected

      if (!file) {
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to upload dataset.'
        this.upload.error = 'Selected file could not be found. Return to step 2 and select a file.'
      }

      this.upload.message = `Uploading ${file.name}...`
      this.upload.progress = 0.25

      try {
        await this.uploadFile(this.upload.dataset, file)
      } catch (err) {
        console.log(err.response || err)

        if (this.upload.status === 'CANCELLED') return

        this.upload.status = 'FAILED'
        this.upload.message = `Failed to upload dataset: ${file.name}.`
        this.upload.error = (err.response && err.response.data.message) || err.toString()

        this.deleteDataset(this.upload.dataset)
        return
      }

      this.upload.progress = 0.75

      try {
        await this.processDataset(this.upload.dataset)
      } catch (err) {
        console.log(err.response || err)

        if (this.upload.status === 'CANCELLED') return

        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to start processing dataset. The file has been saved to the server, but will need to be manually processed. Please contact us for help, or delete it and try uploading again.'
        this.upload.error = (err.response && err.response.data.message) || err.toString()

        return
      }

      this.upload.progress = 1

      this.upload.status = 'DONE'
      this.upload.message = 'Upload complete'

      this.timeout = setTimeout(() => {
        this.$router.push({
          name: 'manageDataset',
          params: {
            datasetId: this.upload.dataset.id
          }
        })
      }, 5000)
    },
    async createDataset () {
      const payload = {
        filename: this.file.selected.name,
        config: {
          timestamp: {
            column: this.timestamp.column.selected,
            timeColumn: this.timestamp.hasTimeColumn ? this.timestamp.timeColumn.select : null,
            utcOffset: this.timestamp.utcOffset.selected.value
          },
          variables: []
        },
        metadata: {
          description: this.metadata.description
        }
      }

      this.values.variables.forEach(d => {
        payload.config.variables.push({
          id: d.variable.selected.id,
          column: d.column.selected,
          scale: d.units.selected.scale,
          offset: d.units.selected.offset,
          flag: d.flag.selected
        })
      })

      const response = await this.$http.restricted.post(
        `/stations/${this.stationId}/datasets`,
        payload
      )

      return response.data
    },
    async updateDataset (dataset, payload) {
      return await this.$http.restricted.put(
        `/stations/${this.stationId}/datasets/${dataset.id}`,
        payload
      )
    },
    async processDataset (dataset) {
      return await this.$http.restricted.post(
        `/stations/${this.stationId}/datasets/${dataset.id}/process`,
        null
      )
    },
    async deleteDataset (dataset) {
      try {
        await this.$http.restricted.delete(`/stations/${this.stationId}/datasets/${dataset.id}`)
      } catch (err) {
        console.log(`Failed to delete dataset (id=${dataset.id})`)
        console.error(err)
      }
    },
    async uploadFile (dataset, file) {
      await this.updateDataset(dataset, { status: 'UPLOADING' })

      const formData = new FormData()
      Object.keys(dataset.presignedUrl.fields).forEach((key) => {
        formData.append(key, dataset.presignedUrl.fields[key])
      })
      formData.append('file', file)

      const response = await this.$http.external.post(dataset.presignedUrl.url, formData)

      const payload = {
        url: `https://${dataset.s3.Bucket}.s3.amazonaws.com/${dataset.s3.Key}`,
        s3: response.data.s3
      }

      await this.updateDataset(dataset, payload)
    },
    cancelUpload () {
      if (this.upload.status === 'READY') {
        return this.$router.push({
          name: 'manageDatasets'
        })
      } else if (this.upload.status === 'DONE') {
        return this.$router.push({
          name: 'manageDataset',
          params: {
            datasetId: this.upload.dataset.id
          }
        })
      }
      this.upload.status = 'CANCELLED'

      if (this.upload.dataset) {
        this.deleteDataset(this.upload.dataset)
      }
    }
  }
}
</script>
