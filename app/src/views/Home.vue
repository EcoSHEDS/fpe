<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <h1 class="text-h2 font-weight-thin my-8 ml-4" v-if="$vuetify.breakpoint.mdAndUp">Welcome to the Flow Photo Explorer</h1>
        <h1 class="text-h3 font-weight-thin my-8 ml-4" v-else>Welcome to the Flow Photo Explorer</h1>
        <v-divider></v-divider>
      </v-col>
    </v-row>
    <v-row justify="space-around">
      <v-col cols="12" lg="6" xl="5" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lg }">
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

        <p class="">
          The <strong>Flow Photo Explorer</strong> is an <strong>integrated database, machine learning, and data visualization</strong> platform for monitoring <strong>streamflow</strong> and other hydrologic conditions using <strong>timelapse images</strong>. The goal of this project is to develop new approaches to monitoring hydrologic conditions in streams and rivers where flow data are historically sparse or non-existent.
        </p>

        <v-img src="img/fpe-diagram.png" alt="FPE diagram of images to machine learning models to estimated streamflow" class="mx-4 my-8"></v-img>

        <div class="text-center my-10">
          <v-btn color="success" x-large :to="{ name: 'explorer' }">Start Exploring <v-icon>mdi-chevron-right</v-icon></v-btn>
        </div>

        <p>
          <strong>Do you have flow photos to contribute?</strong> <router-link :to="{ name: 'request' }">Request an account</router-link> to upload your photos.<br>
          <strong>Already have an account?</strong> <router-link :to="{ name: 'login' }">Log in</router-link>.<br>
          <strong>Questions?</strong> You can reach us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a>.
        </p>
      </v-col>
      <v-col cols="12" lg="6" xl="5" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lg }">
        <video src="video/AIML_FINALDRAFT_v3_optim.mp4" controls width="100%" poster="video/AIML_FINALDRAFT_v3_optim.jpg"></video>

        <p class="font-weight-bold text--secondary font-italic">Video produced by the <a href="https://www.usgs.gov/centers/md-de-dc-water">USGS MD-DE-DC Water Science Center</a></p>

        <p>
          The Flow Photo Explorer project is a collaboration between U.S. Geological Survey, U.S. Environmental Protection Agency, Walker Environmental Research, Microsoft Research, and many contributing partners. Funding was provided by U.S. Geological Survey, U.S. Environmental Protection Agency, and National Geographic Society. See <router-link :to="{ name: 'about' }">About</router-link> for more information.
        </p>
      </v-col>
    </v-row>
    <v-row justify="space-around">
      <v-col cols="12" lg="6" xl="5" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lg }">
        <v-toolbar flat dense color="grey lighten-3 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">Deep Learning Model</h2>
          </v-toolbar-title>
        </v-toolbar>
        <div class="ml-4">
          <v-row class="">
            <v-col cols="12" sm="7">
              <p>
                We are actively working on implementing our deep learning model for estimating streamflow from timelapse images. Please note that <strong>FPE does not currently show model results</strong>, only observed data. When the initial model is completed, model predictions will also be shown at sites for which model training was completed.
              </p>
              <p>
                Until then, the methodology and results for our preliminary model can be found in the following publication. A conference presentation by our collaborator and model developer, Dr. Amrita Gupta, can also be found at the link below.
              </p>
            </v-col>
            <v-col cols="12" sm="5">
              <v-img src="img/gupta2022-fig4.png" alt="Figure 4 of Gupta et al (2022) showing good agreement between observed and predicted streamflow"></v-img>
            </v-col>
          </v-row>
          <p class="font-italic mt-4">
            Gupta, A., Chang, T., Walker, J., and B. Letcher (2022). <strong>Towards Continuous Streamflow Monitoring with Time-Lapse Cameras and Deep Learning.</strong> In ACM SIGCAS/SIGCHI Conference on Computing and Sustainable Societies (COMPASS) (COMPASS '22). Association for Computing Machinery, New York, NY, USA, 353–363. <a href="https://doi.org/10.1145/3530190.3534805">https://doi.org/10.1145/3530190.3534805</a>
          </p>
          <div class="body-2"><a href="mailto:ecosheds@usgs.gov">Contact us</a> for a copy of this publication.</div>
        </div>
      </v-col>
      <v-col cols="12" lg="6" xl="5" class="body-1 black--text">
        <v-toolbar flat dense color="grey lighten-3 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">What's New?</h2>
          </v-toolbar-title>
        </v-toolbar>

        <div class="mx-4">
          <div class="d-flex align-end">
            <div class="font-weight-light black--text text-h6">PII Detection, Stations, Video, User Guide, Homepage</div>
            <v-spacer></v-spacer>
            <div class="text-subtitle-2 font-weight-light font-italic">April 28, 2023</div>
          </div>
          <v-divider class="mb-2"></v-divider>
          <div class="body-1">
            <p>All photos are now screened for <strong>Personal Identifying Information (PII)</strong> using <a href="https://github.com/ecologize/CameraTraps/blob/main/megadetector.md">MegaDetector</a> to detect people and vehicles. Images with suspected PII are <u>not shown</u> on the <i>Photo Explorer</i>, but can be reviewed by station owners in the <i>Upload</i> section.</p>
            <p><strong>Stations</strong> can now be categorized by <strong>Waterbody Type</strong> (e.g., stream, lake, etc.) and <strong>Status</strong> (active vs. discontinued). By default, all stations have been marked as "Stream" and "Active". <strong>Please review your stations</strong> in the <i>Upload</i> section to confirm.</p>
            <p>We have a great <strong>new video</strong> about why and how we created FPE, and what it means to us. We have also added detailed <strong>instructions for uploading photos</strong> to FPE in the <router-link :to="{ name: 'user-guide' }">User Guide</router-link>. And lastly, the homepage has received some much-needed <strong>sprucing up</strong>!</p>
          </div>
        </div>

        <v-toolbar flat dense color="grey lighten-3 mt-8 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">Project Status</h2>
          </v-toolbar-title>
        </v-toolbar>

        <div class="mx-4">
          <p><span class="font-weight-bold"><u>Phase I (2020-2022)</u></span>: a database and cloud-based data pipeline was developed for storing, managing, and accessing timelapse imagery of streams and rivers along with associated flow and stage data. The system allows registered users to upload and manage their own photos and (optionally) flow data at multiple locations. The images and flow data are accessible through the <router-link :to="{ name: 'explorer' }">Photo Explorer</router-link>, which provides an interactive and exploratory interface for viewing the timelapse imagery coupled with observed flow data. The images and flow data in the FPE database will serve as the primary data source for developing and training the machine learning models in Phase II.</p>

          <p><span class="font-weight-bold"><u>Phase II (ongoing)</u></span>: the photos and data uploaded to FPE will be used to develop <strong>deep learning models</strong> for estimating <strong>flow</strong> and other hydrologic conditions using <strong>timelapse imagery</strong>. Two types of models are currently being developed (see <a href="https://doi.org/10.1145/3530190.3534805">Gupta et al., 2022</a> for details):</p>

          <ol class="my-4">
            <li>The first model is a classic <strong>regression model</strong> trained using both images and observed (or estimated) flows at each site. This model is designed to estimate the <strong>flow rate</strong> of each image directly. However, because it <strong>requires observed flow data for training</strong>, this model will primarily be used <strong>for comparison</strong> to our second model, which requires only images.</li>
            <li>The second model is a <strong>ranking model</strong> trained using human annotations of <strong>pairwise image comparisons</strong> whereby a person is repeatedly asked which of two images shows more flow. From these pairwise image annotations, the model learns how to <strong>sort the images</strong> from lowest to highest flow. The rank (or percentile) of each image then provides a <strong>relative measure of streamflow</strong>, which alone can provide valuable information such as the duration of droughts or timing of peak flows. The relative streamflow can then be used to estimate <strong>volumetric flow rates</strong> by passing those percentiles through an assumed or estimated statistical distribution of streamflow at each site. The <strong>critical benefit</strong> of the image ranking model is that it <strong>does not require any observed flow or stage data for training, only images</strong>.</li>
          </ol>

          <p>In addition, other types of models including detecting flow/no flow, or the presence of ice are also being explored. Lastly, all images are now screened for the presence of <strong>Personal Identifying Information (PII)</strong> using the <a href="https://github.com/ecologize/CameraTraps/blob/main/megadetector.md">MegaDetector</a> object detection model.</p>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Home'
}
</script>
