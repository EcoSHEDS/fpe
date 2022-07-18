<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="4">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Welcome to the Flow Photo Explorer
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text">
            <v-alert
              type="warning"
              border="left"
              text
              colored-border
              class="body-2"
              v-if="$vuetify.breakpoint.mobile"
            >
              <div class="font-weight-bold body-1">Not Optimized for Mobile Devices</div>
              <div>This website is primarily designed for latop or desktop computers.</div>
            </v-alert>

            <v-alert color="warning" colored-border border="left" :value="true" elevation="2">
              <div class="text-h6 mb-2"><v-icon left large>mdi-alert</v-icon> Flow Photos Wanted!</div>

              <p>
                We are currently looking for users interested in collecting and uploading timelapse photos of streams across the U.S. to support the development of deep learning models that will estimate flows from images.
              </p>
              <p class="mb-0">
                If you are interested in contributing to this project, check out our <router-link :to="{ name: 'user-guide' }">User Guide</router-link>, which provides a Standard Operating Procedure (SOP) and other tips on collecting flow photos for FPE. If you have any questions, please <a href="mailto:gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com">get in touch</a>.
              </p>
            </v-alert>

            <p>
              The Flow Photo Explorer is an integrated database and machine learning platform for estimating streamflow from timelapse imagery. The goal of this project is to develop new approaches to monitoring hydrologic conditions in streams and rivers where flow data are historically sparse or non-existent.
            </p>

            <v-img src="@/assets/img/fpe-diagram.png" alt="FPE diagram of images to machine learning models to estimated streamflow" class="ma-4"></v-img>

            <p>
              Check out the interactive <router-link :to="{ name: 'explorer' }">Photo Explorer</router-link> to view our current database of flow photos and data and explore how streams change over time (preliminary model results coming soon!).
            </p>

            <div class="text-center my-10">
              <v-btn color="success" x-large :to="{ name: 'explorer' }">Start Exploring <v-icon>mdi-chevron-right</v-icon></v-btn>
            </div>

            <p>
              <strong>Do you have flow photos to contribute?</strong> <router-link :to="{ name: 'requestAccount' }">Request an account</router-link> to upload your photos and data.<br>
              <strong>Already have an account?</strong> <router-link :to="{ name: 'login' }">Log in</router-link>.
            </p>

            <v-divider class="my-4"></v-divider>

            <div class="text-h6">Project Status</div>

            <p><span class="font-weight-bold">Phase I (complete)</span>: a database and cloud-based data pipeline was developed for storing, managing, and accessing timelapse imagery of streams and rivers along with associated flow and stage data. The system allows registered users to upload and manage their own photos and (optionally) flow data at multiple locations. The images and flow data are accessible through the <router-link :to="{ name: 'explorer' }">Photo Explorer</router-link>, which provides an interactive and exploratory interface for viewing the timelapse imagery coupled with observed flow data. The images and flow data in the FPE database will serve as the primary data source for developing and training the machine learning models in Phase II.</p>

            <p><span class="font-weight-bold">Phase II (ongoing)</span>: the photos and data uploaded to FPE are currently being used to develop deep learning models to predict flow from timelapse imagery. Two types of models are currently being developed:

            <ol class="my-4">
              <li>The first is a classical <span class="font-weight-bold">regression model</span> that is trained using both images and observed (or estimated) flows. This model will predict the flow rate directly from an image. However, it requires observed flow data for training, which negates (to some degree) the purpose of using timelapse imagery in the first place.</li>
              <li>The second is a <span class="font-weight-bold">ranking model</span> that is trained using human annotations of pairwise image comparisons (i.e., a user is repeatedly asked which of two images has more flow). The model then learns how to sort the images from lowest to highest flow, which provides a relative measure of streamflow (i.e., rank percentile). This relative streamflow output can then be converted to estimated flow rates using an assumed flow distribution. The major benefit of this model is that it does not require any observed flow or stage data for training.</li>
            </ol>

            <p>Other types of models including detecting flow/no flow, or the presence of ice are also being explored. More about these models is coming soon!</p>

            <v-divider class="my-4"></v-divider>

            <div class="text-h6">About the Project</div>
            <p>
              The Flow Photo Explorer project is a collaboration between U.S. Environmental Protection Agency, U.S. Geological Survey, Walker Environmental Research, Conservation Science Partners, and many contributing partners. Funding was provided by U.S. Environmental Protection Agency and National Geographic Society. See <router-link :to="{ name: 'about' }">About</router-link> for more information.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Home'
}
</script>
