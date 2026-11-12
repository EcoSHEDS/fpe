<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              General Terms and Conditions
            </v-toolbar-title>
          </v-toolbar>

          <v-card-text class="body-1 black--text">
            <p class="body-2 grey--text text--darken-1 mb-0">Version: v1.0</p>
            <p class="body-2 grey--text text--darken-1">Last updated: 11/10/2026</p>
            <p><em>For clarifications, contact the project team at <a
                  href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a></em>. <em>Responses provided in 1-2 business
                days.</em></p>
            <h2 id="background" class="text-h6 mt-6 mb-2">Background</h2>
            <p>Small headwater streams, and many other relatively remote locations of interest, are often
              underrepresented by existing monitoring networks. Using low-cost trail cameras, environmental changes such
              as floods, droughts, and ice coverage can be readily documented with imagery. The purpose of the United
              States Geological Survey (USGS) Flow Photo Explorer is to provide an easy-to-use web interface for
              managing this imagery, annotating it using an integrated interface for pairwise ranking, training deep
              learning models with an established ranking model approach, and providing users with quantitative
              estimates of relative dynamics over time for the imagery. The web platform allows non-USGS users to
              establish accounts and to upload their own imagery into the tool for camera locations, called "stations".
              Users who create stations become "station managers" who can set the visibility for their own stations,
              enter metadata, and designate "collaborators" who are also able to manage stations. Any user with an
              account may also complete annotations on any publicly visible stations.</p>
            <h2 id="purpose" class="text-h6 mt-6 mb-2">Purpose</h2>
            <p>The purpose of this document is to describe data management, set user expectations, and outline USGS,
              Department of Interior (DOI), and federal policies that govern the Flow Photo Explorer platform. If you do
              not agree with the terms and conditions, please do not use the platform.</p>
            <h2 id="intended-use" class="text-h6 mt-6 mb-2">Intended Use</h2>
            <p>The Flow Photo Explorer is an integrated imagery management and modeling tool. Although the imagery
              visualization tools are useful, the primary products of the platform are the ranking models and the
              numeric predictions the models create from the images. Each model, the annotations used to create it, and
              its predictions are published to the USGS ScienceBase digital repository in a self-contained citable web
              page where users can access the model results. The model results are also visible on Flow Photo Explorer.
            </p>
            <p>What Flow Photo Explorer is:</p>
            <ul class="mb-4">
              <li>A web tool for viewing and interacting with imagery to estimate variations in environmental conditions
                (streamflow, etc.).</li>
              <li>A web-based annotation tool for pairwise ranking of environmental conditions.</li>
              <li>A tool for applying a published ranking modeling method to environmental imagery.</li>
              <li>A process for publishing image ranking model results to the USGS ScienceBase platform.</li>
            </ul>
            <p>What Flow Photo Explorer is NOT:</p>
            <ul class="mb-4">
              <li>A service to transfer imagery data between project teams or individuals.</li>
              <li>A replacement for other types of sensor-based monitoring.</li>
              <li>A system to identify, track, confirm, or search for specific individuals appearing in imagery, which
                is restricted by interim guidance from the acting Department of Interior Departmental Privacy
                Officer<sup><a href="#fn1" id="fnref1" @click.prevent="$vuetify.goTo('#fn1')">1</a></sup>.</li>
              <li>A system for the purposes of monitoring human behavior, activity, movement, or presence rather than
                environmental conditions, which is restricted by interim guidance from the acting Department of Interior
                Departmental Privacy Officer <sup>1</sup>.</li>
            </ul>
            <p>The Flow Photo Explorer team is not responsible for determining the source of the imagery data; the user
              is responsible for ensuring the imagery is collected with any applicable permits, permissions, and in
              compliance with applicable laws, regulations, and data sharing agreements. Cameras should target
              environmental features (i.e. rivers, landscapes) and not areas such as walkways, building entrances, or
              recreational gathering points.</p>
            <p>The Flow Photo Explorer is a platform undergoing active research and development. No warranties are made
              about model performance. Users are encouraged to read the associated publications on the home page of the
              website to understand the benefits and limitations of the methodology, understanding that new applications
              of the method may lead to additional knowledge about the model’s capabilities. The imagery data and
              annotations provided by users may be used to enhance platform functionality, incorporated in analyses by
              project team staff, or included in publications (publicly visible sites only).</p>
            <h2 id="data-storage" class="text-h6 mt-6 mb-2">Data Storage</h2>
            <p>The datasets provided to the Flow Photo Explorer by users are considered federal records and will be
              maintained in accordance with applicable regulations<sup><a href="#fn2" id="fnref2"
                  @click.prevent="$vuetify.goTo('#fn2')">2</a></sup>. <strong><mark>Users are highly encouraged to have
                  their own local copies of the imagery uploaded to the Flow Photo Explorer</mark>.</strong> This is
              because changes to staffing and program funding could interrupt access to the imagery on the website,
              though account holders will be notified in advance of this event. No warranties are made for downloading
              imagery, timeseries data, annotations, or other data from the Flow Photo Explorer database to any user
              outside of a Freedom of Information Act (FOIA) request (see later section). The exception is via
              publication of model results to the USGS ScienceBase digital repository for all publicly visible stations,
              which will be automated and occur on an ongoing basis.</p>
            <h2 id="platform-updates" class="text-h6 mt-6 mb-2">Platform Updates</h2>
            <p>The Flow Photo Explorer is supported by funds from the USGS Next Generation Water Observing System
              Research and Development, the Eastern Ecological Science Center, and the USGS Chesapeake Bay Studies
              Program, among others. The platform is in active development and changes to the appearance, modeling
              methodology, timing of model runs, and features are at the discretion of the project staff and
              programmatic priorities.</p>
            <h2 id="prohibited-content" class="text-h6 mt-6 mb-2">Prohibited Content</h2>
            <p>The following are prohibited under these terms and conditions:</p>
            <ul class="mb-4">
              <li>Personally identifiable information (PII). Please see <a
                  href="https://www.gsa.gov/reference/gsa-privacy-program/rules-and-policies-protecting-pii-privacy-act"
                  target="_blank"
                  rel="noopener">https://www.gsa.gov/reference/gsa-privacy-program/rules-and-policies-protecting-pii-privacy-act</a>
                for additional details on what constitutes PII.</li>
              <li>Copyrighted or other restricted content outside of its permitted use, including imagery and monitoring
                datasets.</li>
              <li>Lewd or inappropriate imagery, text, or other materials.</li>
            </ul>
            <p>Images containing prohibited content will be removed from public visibility, accounts providing this
              information will be suspended, and further action will be taken in consultation with the DOI Office of the
              Solicitor and DOI Office of the Privacy Officer.</p>
            <h2 id="privacy" class="text-h6 mt-6 mb-2">Privacy</h2>
            <p>When establishing a station in Flow Photo Explorer, users can elect to make their station publicly
              visible or to restrict visibility to "private". In this case "private" means that station metadata and any
              associated imagery and model predictions are only visible to logged-in users who are a) the station
              manager, b) those designated as a collaborator by the station manager, or c) the Flow Photo Explorer team.
              If users are concerned about showing the imagery publicly, they can select "private" in the station
              management page at any time. Data provided to private stations are still records governed by records laws
              (see FOIA section below).</p>
            <p>As an additional layer of privacy, Flow Photo Explorer automatically identifies and does not display
              images that contain people or vehicles. Automatic detection is implemented with a pre-trained deep
              learning model called MegaDetector<sup><a href="#fn3" id="fnref3"
                  @click.prevent="$vuetify.goTo('#fn3')">3</a></sup>. The model is run entirely within the Flow Photo
              Explorer system and requires no external data transfer. This use was approved following a DOI Privacy
              Threshold Analysis (PTA). The images are retained the same as all other images and are still used in the
              ranking model analysis but are not shown publicly. The MegaDetector model is accurate, with one
              study<sup><a href="#fn4" id="fnref4" @click.prevent="$vuetify.goTo('#fn4')">4</a></sup> reporting 93.8%
              accuracy detecting people and 99.3% accuracy for detecting vehicles, but the model is not perfect. If
              images containing people or vehicles are not automatically identified or are incorrectly identified, the
              station manager may adjust the public visibility of individual images.</p>
            <h2 id="data-sharing" class="text-h6 mt-6 mb-2">Data Sharing</h2>
            <p>If a third party requests imagery or other data from a station, the request will be referred to the user
              who created the station, called the "station manager". The Flow Photo Explorer will not transmit web-based
              bulk downloads of imagery data to external third parties, since there are costs associated with
              transferring imagery and the system is not equipped to transfer large amounts of data. In the coming
              years, images stored in the Flow Photo Explorer collected by the USGS are planned to be released via the
              USGS National Imagery Management System (NIMS, <a href="https://api.waterdata.usgs.gov/docs/nims/"
                target="_blank" rel="noopener">https://api.waterdata.usgs.gov/docs/nims/</a>) which will enable public
              Application Programming Interface (API) access of the imagery. Imagery provided by non-USGS sources will
              not be distributed in this manner.</p>
            <p>The images shown publicly on the web page <em>could</em> be manually copied via screen capture by third
              parties without the knowledge of the Flow Photo Explorer team. If this is unacceptable, the station
              manager could consider making the station private (see "Privacy").</p>
            <p>In keeping with DOI guidance and USGS privacy policies<sup>1,</sup><sup><a href="#fn5" id="fnref5"
                  @click.prevent="$vuetify.goTo('#fn5')">5</a></sup>, imagery will not be repurposed for law
              enforcement, surveillance, investigative, or intelligence activities, and requests from law enforcement or
              other internal or external entities seeking imagery for individual identification or investigative
              purposes will be declined.</p>
            <h2 id="citation" class="text-h6 mt-6 mb-2">Citation</h2>
            <p>If you are using model results produced by the USGS Flow Photo Explorer, please cite the corresponding
              station-specific data release:</p>
            <p class="ml-4"><em>Phillip J. Goodling, Jeff D. Walker, Jennifer H. Fair, and Amrita Gupta,
                202<strong><mark>X</mark></strong>, Imagery Station <strong><mark>XX</mark></strong>
                [<strong><mark>Station_name_here</mark></strong>]: U.S. Geological Survey, <a
                  href="https://doi.org/10.5066/P1DYVVFC" target="_blank"
                  rel="noopener">https://doi.org/10.5066/P1DYVVFC</a>.</em></p>
            <p>(Replacing the highlighted portions of the citation with the true values found at the stable DOI link: <a
                href="https://doi.org/10.5066/P1DYVVFC" target="_blank"
                rel="noopener">https://doi.org/10.5066/P1DYVVFC</a>)</p>
            <p>Cite these publications for the modeling methodology:</p>
            <p class="ml-4">
              <em>Goodling, P.J., Fair, J.H., Gupta, A., Walker, J.D., Dubreuil, T., Hayden, M., and Letcher, B.H.,
                2025, Technical note: A low-cost approach to monitoring relative streamflow dynamics in small headwater
                streams using time lapse imagery and a deep learning model: Hydrology and Earth System Sciences, v. 29,
                no. 22, p. 6445-6460, at https://doi.org/10.5194/hess-29-6445-2025.<br>
                <br>
                Gupta, A., Chang, T., Walker, J., and B. Letcher (2022). Towards Continuous Streamflow Monitoring with
                Time-Lapse Cameras and Deep Learning. In ACM SIGCAS/SIGCHI Conference on Computing and Sustainable
                Societies (COMPASS) (COMPASS '22). Association for Computing Machinery, New York, NY, USA, 353-363.
                https://doi.org/10.1145/3530190.3534805</em>
            </p>
            <p>
              See this software release for modeling code that can use the model objects provided in the
              station-specific data releases:
            </p>
            <p class="ml-4"><em>Walker, J.D., Gupta, A., Fair, J.B., Goodling, P.J., and Letcher, B.A., 2025, Streamflow Rank
                Estimation (SRE) Model: U.S. Geological Survey software release, https://doi.org/10.5066/P1YSANVM.</em>
            </p>
            <h2 id="freedom-of-information-act-foia" class="text-h6 mt-6 mb-2">Freedom of Information Act (FOIA)</h2>
            <p>The USGS Flow Photo Explorer team will comply with the FOIA. The FOIA is a Federal statute which allows
              individuals to request access to federal agency records, except to the extent records are claimed as
              exempt from disclosure under one or more of the nine (9) exemptions of the FOIA. More information is
              available at <a href="https://www.foia.gov/" target="_blank" rel="noopener">https://www.foia.gov/</a>.
              Users should be aware that imagery and other data submitted to the platform are federal records and
              subject to qualified requests.</p>
            <h2 id="data-liability-disclaimer" class="text-h6 mt-6 mb-2">Data Liability Disclaimer</h2>
            <p>These data are preliminary or provisional and are subject to revision. They are being provided to meet
              the need for timely best science. The data have not received final approval by the USGS and are provided
              on the condition that neither the USGS nor the U.S. Government shall be held liable for any damages
              resulting from the authorized or unauthorized use of the data.</p>
            <h2 id="glossary" class="text-h5 mt-8 mb-2">Glossary</h2>
            <p><strong>Annotation</strong>: A process of pairwise image selection that occurs on the Flow Photo Explorer
              website. Only users with accounts can perform annotation. Users are shown two randomly-selected images
              from a single site and they designate which has the greater apparent streamflow (or other quantity if they
              are annotating for ice, snow, algae, or other attribute).</p>
            <p><strong>Collaborator</strong>: A user who is able to upload data and edit metadata for a station because
              they were given access by the station manager.</p>
            <p><strong>Station</strong>: An individual monitoring site at which imagery data and other data are
              collected. Stations are assigned a unique identifier and have metadata describing their location and other
              salient features.</p>
            <p><strong>Station Manager:</strong> User who creates a station. The data and metadata is uploaded, edited
              and managed individually by the station manager or by those user accounts designated by the station
              manager.</p>
            <p><strong>User</strong>: An account holder with the Flow Photo Explorer platform. Accounts are established
              by request using an email address.</p>

            <v-divider class="my-4"></v-divider>
            <ol class="body-2">
              <li id="fn1">Walter, Clay, personal communication, dated May 5<sup>th</sup>, 2026&nbsp;<a href="#fnref1"
                  title="Back to text" @click.prevent="$vuetify.goTo('#fnref1')">↩︎</a></li>
              <li id="fn2">44 U.S.C. 31 - Records Management by Federal Agencies (Federal Records Act)&nbsp;<a
                  href="#fnref2" title="Back to text" @click.prevent="$vuetify.goTo('#fnref2')">↩︎</a></li>
              <li id="fn3">Leorna, S., and Brinkman, T., 2022, Human vs. machine: Detecting wildlife in camera trap
                images: Ecological Informatics, v. 72, p. 101876, at <a
                  href="https://doi.org/10.1016/j.ecoinf.2022.101876" target="_blank"
                  rel="noopener">https://doi.org/10.1016/j.ecoinf.2022.101876</a>. Model accessed from <a
                  href="https://github.com/agentmorris/MegaDetector/blob/main/megadetector.md" target="_blank"
                  rel="noopener">MegaDetector/megadetector.md at main · agentmorris/MegaDetector</a>.&nbsp;<a
                  href="#fnref3" title="Back to text" @click.prevent="$vuetify.goTo('#fnref3')">↩︎</a></li>
              <li id="fn4">Mitterwallner, V., Peters, A., Edelhoff, H., Mathes, G., Nguyen, H., Peters, W., Heurich, M.
                and Steinbauer, M.J. (2024), Automated visitor and wildlife monitoring with camera traps and machine
                learning. Remote Sens Ecol Conserv, 10: 236-247. <a href="https://doi.org/10.1002/rse2.367"
                  target="_blank" rel="noopener">https://doi.org/10.1002/rse2.367</a>&nbsp;<a href="#fnref4"
                  title="Back to text" @click.prevent="$vuetify.goTo('#fnref4')">↩︎</a></li>
              <li id="fn5">See <a href="https://www.usgs.gov/office-of-the-director/privacy-policies" target="_blank"
                  rel="noopener">https://www.usgs.gov/office-of-the-director/privacy-policies</a>&nbsp;<a href="#fnref5"
                  title="Back to text" @click.prevent="$vuetify.goTo('#fnref5')">↩︎</a></li>
            </ol>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Terms'
}
</script>
