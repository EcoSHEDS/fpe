<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              About the Project
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text">
            <div class="text-h6">Overview</div>
            <p>
              Flow is a critical variable in streams since it affects aquatic and riparian biological communities and human uses of water (i.e., recreation, public water supply, etc.). Flow regimes are changing due to anthropogenic (e.g., water withdrawals) and natural impacts (e.g., extreme weather events). Many states consider issues with altered hydrology as a growing priority and some have developed flow criteria for streams. However, most USGS gages are not located in small to mid- size streams and deployment of hydrological equipment is costly and requires specialized expertise. This project was created to help states, tribes and other entities by promoting a low-cost and user-friendly alternative with the use of continuous imagery for flow monitoring.
            </p>

            <div class="text-h6">Objectives</div>
            <div>This project has two main objectives:</div>
            <ol class="mt-2">
              <li>
                Create a web-based data portal for uploading, storing, and exploring streamflow photos and data.
              </li>
              <li>
                Develop machine learning models to estimate flow (or stage) directly from timelapse imagery using the photos and data collected through this portal.
              </li>
            </ol>
            <p class="mt-2">
              Together the web-based data portal and machine learning models will provide an exciting new platform for monitoring flow in rivers and streams based on low cost timelapse imagery.
            </p>
            <div class="text-h6">Project Team</div>

            <div class="mt-2 font-weight-medium">Development Team</div>
            <ul>
              <li>Ben Letcher, USGS - Principal Investigator</li>
              <li>Jeff Walker, Walker Environmental Research - Database and Web Application Developer</li>
              <li>Jenn Fair, USGS - Research Hydrologist and Field Coordinator</li>
              <li>Todd Dubreuil, USGS - Ecologist and Field Technician</li>
              <li>Mike Hayden, USGS - Fish Biologist and Field Technician</li>
              <li>Tony Chang, Conservation Science Partners - Machine Learning Model Developer</li>
              <li>Amrita Gupta, Conservation Science Partners - Machine Learning Model Developer</li>
            </ul>

            <div class="mt-2 font-weight-medium">Project Management</div>
            <ul>
              <li>Kelly Krock, US EPA Region 2</li>
              <li>Emily Nering, US EPA Region 3</li>
              <li>Katharine Marko, US EPA Region 5</li>
              <li>Britta Bierwagen, US EPA ORD NCEA</li>
            </ul>

            <div class="mt-2 font-weight-medium">Partners and Contributors</div>
            <ul>
              <li>CT Dept. of Energy and Environment, Christopher Bellucci</li>
              <li>Fond du Lac Band of Lake Superior Chippewa, Kari Hedin</li>
              <li>Pokagon Band of Potawatomi Dept Natural Resources, Grant Poole</li>
              <li>US EPA Region 1, Tom Faber</li>
              <li>US EPA Region 5, Ed Hammer, Mari Nord, Micah Bennett</li>
            </ul>

            <div class="text-h6 mt-4">Funding</div>
            <p>This project was funded by a U.S. Environmental Protection Agency Innovation Project Interagency Agreement (DW-014-92517601-0) with U.S. Geological Survey and an AI for Earth Innovation Grant (# NGS-67677T-20) from the National Geographic Society.</p>

            <div class="text-h6">Contact Us</div>
            <p>
              Please send any questions or comments about this project to the ecoSHEDS team at <a href="mailto:gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com">gs-naar-lsc-ecosheds@doimspp.onmicrosoft.com</a>.
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'About'
}
</script>
