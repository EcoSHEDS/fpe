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
      <!-- WELCOME -->
      <v-col cols="12" lg="6" xl="6" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lgAndUp }">
        <div class="mx-4">
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

          <p>
            The <strong>Flow Photo Explorer (FPE)</strong> is an integrated database, machine learning, and data visualization platform for monitoring streamflow and other hydrologic conditions using timelapse images.
          </p>
          <p>
            The goal of this project is to develop new approaches for collecting hydrologic data in streams, lakes, and other waterbodies, especially in places where traditional monitoring methods and technologies are not feasible or cost-prohibitive.
          </p>

          <v-img src="img/fpe-diagram.png" alt="FPE diagram of images to machine learning models to estimated streamflow" class="mx-4 my-8"></v-img>

          <div class="text-center my-10">
            <v-btn color="success" x-large :to="{ name: 'explorerHome' }">Start Exploring <v-icon>mdi-chevron-right</v-icon></v-btn>
          </div>

          <p>
            <strong>Want to add your timelapse photos to FPE?</strong> <router-link :to="{ name: 'request' }">Request an account</router-link> to upload your photos.<br>
            <strong>Want to receive periodic updates about the project?</strong> <a href="https://public.govdelivery.com/accounts/USDOIGS/subscriber/new?topic_id=USDOIGS_120">Sign up</a> for our email newsletter.<br>
            <strong>Questions?</strong> You can reach us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a>.
          </p>
        </div>
      </v-col>

      <!-- VIDEO -->
      <v-col cols="12" lg="6" xl="6" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lgAndUp }">
        <video src="video/AIML_FINALDRAFT_v3_optim.mp4" controls width="100%" poster="video/AIML_FINALDRAFT_v3_optim.jpg"></video>

        <div class="mx-4">
          <p class="font-weight-bold text--secondary font-italic">Video produced by the <a href="https://www.usgs.gov/centers/md-de-dc-water">USGS MD-DE-DC Water Science Center</a></p>

          <p>
            FPE is a collaboration between U.S. Geological Survey (USGS), U.S. Environmental Protection Agency (USEPA), Walker Environmental Research, Microsoft Research, and many contributing partners. Funding was provided by USGS, USEPA, and National Geographic Society. See <router-link :to="{ name: 'about' }">About</router-link> for more information.
          </p>
        </div>
      </v-col>
    </v-row>
    <v-row justify="space-around">
      <!-- WHATS NEW -->
      <v-col cols="12" lg="6" xl="6" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lgAndUp }">
        <v-toolbar flat dense color="grey lighten-3 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">What's New?</h2>
          </v-toolbar-title>
        </v-toolbar>

        <div class="mx-4">
          <div class="d-flex align-end">
            <div class="font-weight-light black--text text-h6">Explorer Upgrade, Model Results, and Newsletter</div>
            <v-spacer></v-spacer>
            <div class="text-subtitle-2 font-weight-light font-italic">April 10, 2024</div>
          </div>
          <v-divider class="mb-2"></v-divider>
          <div class="body-1">
            <p>
              Major upgrade to the <router-link :to="{ name: 'explorerHome' }">Photo Explorer</router-link> that incoporates initial model predictions. This update includes a complete overhaul of the data visualization charts for exploring both observed data and model predictions, including the original timeseries and distribution charts as well as a new scatterplot for comparing two variables (e.g., observed flow vs. model predictions).
            </p>
            <p>
              Model predictions are currently available for a set of USGS stations located in the West Brook Study Area, in central MA. Over the coming months, we will be adding more model predictions for other stations as results become available.
            </p>
            <p>
              Lastly, we have created an official email list that will be used to announce updates. If you'd like to receive these, please <a href="https://public.govdelivery.com/accounts/USDOIGS/subscriber/new?topic_id=USDOIGS_120">Sign Up here</a>.
            </p>
            <p>
              To read more about these changes, please see our <a href="https://content.govdelivery.com/accounts/USDOIGS/bulletins/397081f">latest newsletter</a>.
            </p>
          </div>
          <div v-if="showMoreNews">
            <div class="d-flex align-end">
              <div class="font-weight-light black--text text-h6">Preliminary Annotation Interface</div>
              <v-spacer></v-spacer>
              <div class="text-subtitle-2 font-weight-light font-italic">June 15, 2023</div>
            </div>
            <v-divider class="mb-2"></v-divider>
            <div class="body-1">
              <p>
                A <strong>user interface for annotating flow photos</strong> is now available for testing. Using this interface, users perform a series of pairwise comparisons by identifying which of two photos contains more flow. Users can also classify each photo by identifying hydrologic conditions such as dry streambed, disconnected pools, and full/partial ice and snow cover. These annotations will then be used to train our deep learning model for predicting streamflow from timelapse images.
              </p>
              <p>
                The annotation interface is only accessible to a select group of users for initial testing and development. To gain access, please contact us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a>.
              </p>
            </div>

            <div class="d-flex align-end">
              <div class="font-weight-light black--text text-h6">PII Detection, Stations, Video, User Guide, Homepage</div>
              <v-spacer></v-spacer>
              <div class="text-subtitle-2 font-weight-light font-italic">April 28, 2023</div>
            </div>
            <v-divider class="mb-2"></v-divider>
            <div class="body-1">
              <p>All photos are now screened for <strong>Personal Identifying Information (PII)</strong> using <a href="https://github.com/ecologize/CameraTraps/blob/main/megadetector.md">MegaDetector</a> to detect people and vehicles. Images with suspected PII are <u>not shown</u> on the <i>Photo Explorer</i>, but can be reviewed by station owners in the <i>Upload</i> section.</p>
              <p><strong>Stations</strong> can now be categorized by <strong>Waterbody Type</strong> (e.g., stream, lake, etc.) and <strong>Status</strong> (active vs. discontinued). By default, all stations have been marked as "Stream" and "Active". <strong>Please review your stations</strong> in the <i>Upload</i> section to confirm.</p>
              <p>We have a great <strong>new video</strong> about why and how we created FPE, and what it means to us. We have also added detailed <strong>instructions for uploading photos</strong> to FPE in the <router-link :to="{ name: 'user-guide' }">User Guide</router-link>. And lastly, the homepage has received some much-needed sprucing up!</p>
            </div>
          </div>

          <div class="text-center">
            <v-btn text small @click="showMoreNews = !showMoreNews">
              <span v-if="!showMoreNews">Show More Announcements</span>
              <span v-else>Show Less</span>
              <v-icon small right v-if="!showMoreNews">mdi-chevron-down</v-icon>
              <v-icon small right v-else>mdi-chevron-up</v-icon>
            </v-btn>
          </div>
        </div>
      </v-col>

      <!-- DEEP LEARNING MODEL -->
      <v-col cols="12" lg="6" xl="6" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lgAndUp }">
        <v-toolbar flat dense color="grey lighten-3 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">Deep Learning Model</h2>
          </v-toolbar-title>
        </v-toolbar>
        <div class="ml-4">
          <v-row class="">
            <v-col cols="12" sm="7">
              <p>
                We are actively working on developing and refining our deep learning model for estimating streamflow from timelapse images. <strong>Initial model results are now available</strong> for a select set of USGS stations located in the West Brook Study Area in central MA. More results will soon be added for other USGS stations, followed by the USEPA and its collaborators, and lastly all FPE users. See Phase II of the Project Status section below for more details on the model rollout.
              </p>
              <p>
                The methodology and results for our preliminary model can be found in the following publication. A conference presentation by our collaborator and model developer, Dr. Amrita Gupta, can also be found at the link below, or <a href="mailto:ecosheds@usgs.gov">Contact us</a> for a copy.
              </p>
            </v-col>
            <v-col cols="12" sm="5">
              <v-img src="img/gupta2022-fig4.png" alt="Figure 4 of Gupta et al (2022) showing good agreement between observed and predicted streamflow"></v-img>
            </v-col>
          </v-row>
          <p class="font-italic mt-4">
            Gupta, A., Chang, T., Walker, J., and B. Letcher (2022). <strong>Towards Continuous Streamflow Monitoring with Time-Lapse Cameras and Deep Learning.</strong> In ACM SIGCAS/SIGCHI Conference on Computing and Sustainable Societies (COMPASS) (COMPASS '22). Association for Computing Machinery, New York, NY, USA, 353–363. <a href="https://doi.org/10.1145/3530190.3534805">https://doi.org/10.1145/3530190.3534805</a>
          </p>
        </div>
      </v-col>
    </v-row>
    <v-row justify="space-around">
      <!-- PROJECT STATUS -->
      <v-col cols="12" lg="6" xl="6" class="body-1 black--text">
        <v-toolbar flat dense color="grey lighten-3 mt-8 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">Project Status</h2>
          </v-toolbar-title>
        </v-toolbar>

        <div class="mx-4">
          <p><span class="font-weight-bold"><u>Phase I (2020-2022)</u></span>: a database and cloud-based data pipeline was developed for storing, managing, and accessing timelapse imagery of streams and rivers along with associated flow and stage data. The system allows registered users to upload and manage their own photos and (optionally) flow data at multiple locations. The images and flow data are accessible through the <router-link :to="{ name: 'explorerHome' }">Photo Explorer</router-link>, which provides an interactive and exploratory interface for viewing the timelapse imagery coupled with observed flow data. The images and flow data in the FPE database will serve as the primary data source for developing and training the machine learning models in Phase II. All images are screened for the presence of <strong>Personal Identifying Information (PII)</strong> using the <a href="https://github.com/ecologize/CameraTraps/blob/main/megadetector.md">MegaDetector</a> object detection model.</p>

          <p>
            <span class="font-weight-bold"><u>Phase II (ongoing)</u></span>: the photos and data uploaded to FPE are being used to develop <strong>deep learning models</strong> for estimating relative flowusing timelapse imagery. See the Deep Learning Model section on the left or <a href="https://doi.org/10.1145/3530190.3534805">Gupta et al., 2022</a> for more details.
          </p>
          <p>
            During this phase, models will be trained and predictions made available in the following order:
          </p>
          <ol class="my-4">
            <li>
              <strong>USGS West Brook Study Area</strong>: the initial set of models will be trained on stations located in the West Brook study area in central MA. This area has been the focus of a long-term research project on fish population dynamics, and is where the idea for FPE originated. Most of these stations also have streamflow gauges collecting observed flow data that can be used to directly evaluate model performance.
            </li>
            <li>
              <strong>Other USGS Stations</strong>: the next batch of stations to receive models will include USGS stations outside the West Brook, beginning with those having a co-located streamflow gauge.
            </li>
            <li>
              <strong>USEPA and Other Collaborators</strong>: following roll out across the USGS, the model will be trained at stations for the USEPA and its collaborators through the ROAR project, which has provided core funding for FPE.
            </li>
            <li>
              <strong>All Stations</strong>: lastly, once the model framework and training methodology is sufficiently robust, the model will be made available for training at any FPE station.
            </li>
          </ol>

          <p>
            <span class="font-weight-bold"><u>Phase III (2024-2025)</u></span>: as FPE continues to grow and expand, we plan to add many new features and capabilities including:
          </p>

          <ol class="my-4">
            <li>Support for training models to predict other hydrologic parameters such as water level, ice cover, snow depth, algal biomass, and more.</li>
            <li>Development of a statistical methodology for converting the model output, which is currently a <i>relative</i> measure of streamflow to actual streamflow in cubic feet per second.</li>
            <li>Development of classification models for identifying flow/no flow or ice/no ice conditions.</li>
            <li>Support for real-time image transmission and model predictions using cell-enabled cameras.</li>
            <li>In-the-field deployment of the FPE model using edge computing and satellite data transmission.</li>
          </ol>
        </div>
      </v-col>

      <!-- DISCLAIMER -->
      <v-col cols="12" lg="6" xl="6" class="body-1 black--text" :class="{ 'px-8': $vuetify.breakpoint.lgAndUp }">
        <v-toolbar flat dense color="grey lighten-3 mt-8 mb-4">
          <v-toolbar-title>
            <h2 class="text-h5">Disclaimer</h2>
          </v-toolbar-title>
        </v-toolbar>
        <Alert type="error" title="Provisional Database" class="mb-0 mx-4">
          <div style="font-family:monospace">
            The data you have secured from the U.S. Geological Survey (USGS) database identified as the Flow Photo Explorer (FPE) have not received USGS approval and as such are provisional and subject to revision. The data are released on the condition that neither the USGS nor the U.S. Government shall be held liable for any damages resulting from its authorized or unauthorized use.
          </div>
        </Alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Home',
  data () {
    return {
      showMoreNews: false
    }
  }
}
</script>
