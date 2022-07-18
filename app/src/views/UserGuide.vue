<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12" lg="10" xl="8">
        <v-card elevation="4">

          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              User Guide
            </v-toolbar-title>
          </v-toolbar>

          <v-tabs vertical v-model="tab" class="pr-4 pt-4">
            <v-tab class="justify-start">
              <v-icon left>
                mdi-information-outline
              </v-icon>
              Background
            </v-tab>
            <v-tab class="justify-start">
              <v-icon left>
                mdi-camera
              </v-icon>
              Equipment
            </v-tab>
            <v-tab class="justify-start">
              <v-icon left>
                mdi-target
              </v-icon>
              Field Methods
            </v-tab>
            <v-tab class="justify-start">
              <v-icon left>
                mdi-upload
              </v-icon>
              Photo Uploading
            </v-tab>

            <!-- BACKGROUND -->
            <v-tab-item>
              <v-card flat>
                <v-card-text class="black--text body-1">
                  <div class="text-h5">Background</div>

                  <v-img src="@/assets/img/user-guide/avery-brook.jpg" alt="Photo of Avery Brook" class="my-4"></v-img>

                  <p>The goals of the Flow Photo Explorer are to:</p>

                  <ol class="my-4">
                    <li>
                      Develop an <span class="font-weight-bold">innovative new method for monitoring streamflow</span> for estimating the amount and variability of water flowing in small stream networks using time-lapse images captured by inexpensive and off-the-shelf cameras.
                    </li>
                    <li>
                      Provide a <span class="font-weight-bold">web-based platform</span> for making the images, other related data, and model predictions easy to access and explore.
                    </li>
                    <li>
                       Provide an avenue for <span class="font-weight-bold">Citizen Science</span> engagement with the goal of better understanding water resources.
                    </li>
                  </ol>

                  <p>
                    This project will represent a major advancement in how we measure the flow of water by using machine learning (a form of Artifical Intelligence, or AI) capable of recognizing and reproducing patterns in large and complex datasets such as long-term image time-lapses coupled with detailed environmental data. The results of this work will have considerable value for tracking changes in small streams, which are very important habitat for plants and animals.
                  </p>

                  <p>
                    Stream flow is one of the most important environmental drivers in stream habitats. But we do not currently have a good way to measure stream flow in small stream networks. This is especially important now as small streams are increasingly affected by climate change via more frequent intense floods and more loss of connectivity due to droughts.
                  </p>

                  <p>
                    Additional challenges are introduced by increasing stream temperatures. A better understanding of flow changes and patterns in small streams will help us evaluate which streams are the most likely to be climate refugia and are the best candidates for management and policies to protect vital aquatic habitats otherwise at risk due to warming and drying.
                  </p>

                  <p>
                    The following sections provides a simplified Standard Operating Procedure (SOP) for collecting timelapse images using inexpensive and off-the-shelf trail (or "game") cameras.
                  </p>

                  <!-- <p>
                    The complete SOP is also available as a PDF:
                  </p> -->

                  <!-- <v-btn color="primary" href="" download>
                    <v-icon left>mdi-download</v-icon> Download SOP (PDF)
                  </v-btn> -->
                </v-card-text>
              </v-card>
            </v-tab-item>
            <!-- EQUIPMENT -->
            <v-tab-item>
              <v-card flat>
                <v-card-text class="black--text body-1">
                  <div class="text-h5 mb-4">Equipment</div>
                  <p>
                    Below is a list of supplies that can serve as a starting point for acquiring the equipment necessary to capture timelapse images for upload to FPE.
                  </p>

                  <p>
                    Actual items will vary depending on the camera and location you choose, as well as the budget you have available. The categories of equipment will likely stay the same. As long as you have a clear view of the river, the images should be useful.
                  </p>

                  <v-img src="@/assets/img/user-guide/secure-camera.jpg" alt="Deployed game camera" class="my-4"></v-img>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6 mb-4">Cameras</div>

                  <p>FPE is designed to store timelapse images collected by off-the-shelf trail (or "game") cameras.</p>

                  <ul>
                    <li>
                      The camera must provide image files containing <span class="font-weight-bold">EXIF data</span> (most cameras do). The exchangeable image file format (EXIF) data contains technical information about each image such as the camera make and model, size and resolution of the image, and, most importantly, the timestamp that it was taken.
                    </li>
                    <li>
                      The camera must provide <span class="font-weight-bold">timelapse capabilities</span> and support intervals of roughly 15 minutes to 1 hour. Not all game cameras support timelapse mode as some are triggered only by motion-detection.
                    </li>
                    <li>
                      There is currently <span class="font-weight-bold">no resolution requirement</span> for FPE. However, this may change in the future as the models are further refined.
                    </li>
                    <li>
                      An <span class="font-weight-bold">SD card</span> is needed to store the images on the camera and are often sold separately. SD cards vary in speed and size (recommended minimum size is 32 GB). Check camera for compatibility with SD card types.
                    </li>
                    <li>
                      Most cameras are generally powered by <span class="font-weight-bold">batteries</span> (sizes ranging from AA to D depending on the camera). Some cameras also support solar power supplies, but this is not required as most cameras can last 1-6 months on a single set of batteries.
                    </li>
                    <li>
                      Some cameras provide WiFi or cellular connectivity. This is not required as images can be manually retrieved from the camera on a periodic basis (e.g., every 3 months) and then uploaded to FPE. Note that <span class="font-weight-bold">FPE does not support direct uploading</span> from a camera via WiFi or cellular connection.
                    </li>
                    <li>
                      Camera prices generally range from <span class="font-weight-bold">$99 to $599</span> depending on the available features, resolution, and overall quality.
                    </li>
                  </ul>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6 mb-4">Security</div>
                  <ul>
                    <li>
                      A <span class="font-weight-bold">security housing box</span> can be used to securely hold the camera and prevent theft. Security boxes are designed to fit specific camera makes and models, be sure the box is compatible with your camera.<br>
                      <v-img src="@/assets/img/user-guide/security-box.jpg" alt="Security box" class="my-4" max-width="200px"></v-img>
                    </li>
                    <li>
                      A <span class="font-weight-bold">lock</span> is used to to secure the camera in the security box.<br>
                      <v-img src="@/assets/img/user-guide/security-lock.jpg" alt="Security lock" class="my-4" max-width="200px"></v-img>
                    </li>
                    <li>
                      A <span class="font-weight-bold">security cable</span> is used to prevent theft by tethering the camera security box to a tree or other fixture. This cable is different from a tree strap that secures the camera to the tree.<br>
                      <v-img src="@/assets/img/user-guide/security-cable.jpg" alt="Security cable" class="my-4" max-width="200px"></v-img>
                    </li>
                  </ul>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6 mb-4">Camera Mounts</div>
                  <p>
                    There are a variety of ways to mount cameras: tree straps, tree screws, swivel mounts, fence T-posts, and stand-alone ground mounts to name a few. A good mount is critical to collecting consistent time lapse images, which do not shift due to wind or other external forces. It is <span class="font-weight-bold">important for the field-of-view to be as consistent as possible</span> across all images at each station.
                  </p>

                  <div class="font-weight-bold mb-4">Tree Strap</div>
                  <v-img src="@/assets/img/user-guide/tree-strap.jpg" alt="Tree strap" class="my-4" max-width="400px"></v-img>
                  <p>A tree strap is usually provided with the camera for securing the unit to a post or tree.</p>
                  <v-simple-table>
                    <template v-slot:default>
                      <thead>
                        <tr>
                          <th class="text-left">
                            Pros
                          </th>
                          <th class="text-left">
                            Cons
                          </th>
                        </tr>
                      </thead>
                      <tbody style="vertical-align:top">
                        <tr>
                          <td>
                            <ul>
                              <li>Cheap, they come with camera, generally very stable.</li>
                              <li>Hold position well.</li>
                              <li>Camera harder to notice when strapped to tree.</li>
                            </ul>
                          </td>
                          <td>
                            <ul>
                              <li>Holds well but placing back in the same position is difficult.</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>

                  <div class="font-weight-bold mb-4 mt-8">Tree Screw</div>
                  <v-img src="@/assets/img/user-guide/tree-screw.jpg" alt="Tree screw" class="my-4" max-width="400px"></v-img>
                  <p>A tree screw must be purchased separately.</p>
                  <v-simple-table>
                    <template v-slot:default>
                      <thead>
                        <tr>
                          <th class="text-left">
                            Pros
                          </th>
                          <th class="text-left">
                            Cons
                          </th>
                        </tr>
                      </thead>
                      <tbody style="vertical-align:top">
                        <tr>
                          <td>
                            <ul>
                              <li>Many different types.</li>
                              <li>Holds position well.</li>
                              <li>Some versions allow for up and down angle and left to right adjustment.</li>
                            </ul>
                          </td>
                          <td>
                            <ul>
                              <li>If the version is adjustable, care needs to be taken to make sure it is always in the same orientation after maintenance or download.</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>

                  <div class="font-weight-bold mb-4 mt-8">Swivel Mount</div>
                  <v-img src="@/assets/img/user-guide/swivel-mount.jpg" alt="Swivel mount" class="my-4" max-width="400px"></v-img>
                  <p>A swivel mount must be purchased separately.</p>
                  <v-simple-table>
                    <template v-slot:default>
                      <thead>
                        <tr>
                          <th class="text-left">
                            Pros
                          </th>
                          <th class="text-left">
                            Cons
                          </th>
                        </tr>
                      </thead>
                      <tbody style="vertical-align:top">
                        <tr>
                          <td>
                            <ul>
                              <li>Holds position very well.</li>
                              <li>This version allows for up and down angle and left to right adjustment.</li>
                            </ul>
                          </td>
                          <td>
                            <ul>
                              <li>The version is adjustable, although it hold position well, care needs to be taken to make sure it is always in the same orientation after maintenance or download.</li>
                              <li>Expensive</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>

                  <div class="font-weight-bold mb-4 mt-8">Fence T-Post</div>
                  <v-img src="@/assets/img/user-guide/fence-t-post.jpg" alt="Fence T-Post" class="my-4" max-width="400px"></v-img>
                  <p>Fence T-post and camera mount for T-post must be purchased separately.</p>
                  <v-simple-table>
                    <template v-slot:default>
                      <thead>
                        <tr>
                          <th class="text-left">
                            Pros
                          </th>
                          <th class="text-left">
                            Cons
                          </th>
                        </tr>
                      </thead>
                      <tbody style="vertical-align:top">
                        <tr>
                          <td>
                            <ul>
                              <li>Allows for camera to be placed where there are no trees.</li>
                              <li>Post can be placed exactly where you want it.</li>
                              <li>Very stable.</li>
                              <li>Holds position well.</li>
                            </ul>
                          </td>
                          <td>
                            <ul>
                              <li>Need to purchase a metal fence T post.</li>
                              <li>Easily noticed, stands out.</li>
                              <li>Hard to install T post in some rocky riverbanks.</li>
                              <li>If the mount is adjustable, care needs to be taken to make sure it is always in the same orientation after maintenance or download.</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>

                  <div class="font-weight-bold mb-4 mt-8">Ground Mount</div>
                  <v-img src="@/assets/img/user-guide/ground-mount.jpg" alt="Ground Mount" class="my-4" max-width="400px"></v-img>
                  <p>A ground mount must be purchased separately for most cameras (some include a mount).</p>
                  <v-simple-table class="mb-4">
                    <template v-slot:default>
                      <thead>
                        <tr>
                          <th class="text-left">
                            Pros
                          </th>
                          <th class="text-left">
                            Cons
                          </th>
                        </tr>
                      </thead>
                      <tbody style="vertical-align:top">
                        <tr>
                          <td>
                            <ul>
                              <li>Allows for camera to be placed where there are no trees.</li>
                              <li>Easy to install.</li>
                              <li>Hold position well.</li>
                              <li>Very adjustable.</li>
                            </ul>
                          </td>
                          <td>
                            <ul>
                              <li>Easily noticed, stands out.</li>
                              <li>Hard to install in some rocky riverbanks.</li>
                              <li>Holds position well.</li>
                              <li>Not as stable as a T post setup.</li>
                              <li>If the mount is adjustable, care needs to be taken to make sure it is always in the same orientation after maintenance or download.</li>
                            </ul>
                          </td>
                        </tr>
                      </tbody>
                    </template>
                  </v-simple-table>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <!-- METHODS -->
            <v-tab-item>
              <v-card flat>
                <v-card-text class="black--text body-1">
                  <div class="text-h5">Field Methods</div>

                  <v-divider class="my-4"></v-divider>
                  <div class="text-h6">Select a Station</div>

                  <p>Select a location for deploying your field camera.</p>
                  <p>
                    Rivers of any size may be monitored and uploaded to FPE. However, from a research perspective, we are primarily interested in smaller (1st, 2nd, or 3rd order) headwater streams.
                  </p>
                  <p>
                    Choose a location along your river that is reasonably accessible, but not too easily found to avoid vandalism.
                  </p>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6">Setup Camera</div>

                  <p>Install your camera mount to a tree or post near the river bank. Use the security housing, lock, and cable to secure the camera to the tree or post to prevent theft.</p>

                  <v-img src="@/assets/img/user-guide/image-perspective.png" alt="Diagram of camera setup" class="my-4"></v-img>

                  <p>When selecting a location to mount your camera, ensure that:</p>
                  <ul class="mb-4">
                    <li>The camera will have a clear view of the river year round. Avoid areas with dense vegetation that may obscure the camera view, especially in summer.</li>
                    <li>The camera images capture the complete bankfull width of the stream channel.</li>
                    <li>Aim for the images to contain approximately 80% water and 20% neighboring landscape (i.e., forest)</li>
                    <li>The images will contain consistent lighting conditions and will not be strongly impacted by shadows changing over the course of the day.</li>
                    <li>The camera may point upstream, downstream or perpendicular to the river. We are currently evaluating which perspective provides the best data for model performance.</li>
                  </ul>

                  Here is an example of an ideal camera view:

                  <v-img src="@/assets/img/user-guide/image-ideal.png" alt="Example of ideal image perspective" class="my-4"></v-img>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6">Configure Camera</div>

                  <p>Follow these steps to configure your camera to collect timelapse images. It is helpful to create a field sheet with checklist of these steps, and spaces to record the settings and other information configured prior to each deployment</p>

                  <ul class="mb-4">
                    <li>
                      <span class="font-weight-bold">Set the camera's internal date and time</span> to the current local time (see camera user's manual for details). Most game cameras DO NOT adjust for daylight savings time. Thus, all images will be in either daylight savings time or standard time, depending on when the internal time was set in the camera. Repeat this at the start of every deployment as the internal clock can be reset when changing batteries.
                    </li>
                    <li>
                      On your field sheet, <span class="font-weight-bold">record the date and time that the camera was set to</span>, and also <span class="font-weight-bold">note whether the current time is in daylight savings time (summer) or standard time (winter)</span>. This information will be needed when uploading the images to FPE.
                    </li>
                    <li>
                      Set the camera to <span class="font-weight-bold">timelapse mode</span> with intervals between 15 minutes to 1 hour depending on the flashiness of the stream and the amount of memory available on the SD card. Shorter (as low as 1 or 5 minutes) or longer (up to daily) intervals may be used, but the ideal intervals are between 15 minutes and 1 hour.
                    </li>
                    <li>
                      <span class="font-weight-bold">Disable motion detection</span> so that the camera does not collect additional images between the regular timelapse intervals (e.g., due to animal movements).
                    </li>
                    <li>
                      Ensure the <span class="font-weight-bold">batteries are fresh or fully charged</span>.
                    </li>
                    <li>
                      Once the camera is properly configured, secure it within the security housing, and attach it to the mount. Lastly, set the camera to the ON position to begin capturing images.
                    </li>
                  </ul>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6">Retrieve Camera and Download Images</div>

                  <p>After a period of time (usually 1-3 months), return to the camera to download the images, then reset the SD card and replace the batteries to begin another deployment.</p>

                  <ul class="mb-4">
                    <li>
                      Before removing the camera from the mount, <span class="font-weight-bold">mark and record the exact position of both the mount and the camera housing</span>. This can be done by making reference points on the camera mounts, trees, posts or any item you use to secure the camera installation. Taking photos with a smartphone is another useful technique for recording the camera's position before its removed.
                    </li>
                    <li>
                      <span class="font-weight-bold">Remove the camera</span> from the security housing, taking care <span class="font-weight-bold">not to move the mount or position of the housing</span> itself.
                    </li>
                    <li>
                      <span class="font-weight-bold">Retrieve the images</span> by a) downloading the files to a field computer or smartphone and then deleting all existing files from the SD card, or b) swapping the SD card with a new (empty) card.
                    </li>
                    <li>
                      <span class="font-weight-bold">Replace the batteries</span> with new fresh or fully charged batteries.
                    </li>
                    <li>
                      After the images have been downloaded, SD card emptied (or replaced), and batteries replaced, follow the instructions from the previous section (Camera Setup) to start the next deployment. Be sure to double check the internal date and time of the camera and adjust as necessary. Also note whether the camera time is configured for daylight savings or local standard time.
                    </li>
                    <li>
                      When putting the camera back in the housing, try to <span class="font-weight-bold">ensure the field-of-view is as similar to what it was before the camera as removed</span>. The field-of-view should be as consistent as possible between deployments for the best model performance. If the images were downloaded to a field laptop or smartphone, compare the last recorded image to the current field-of-view after replacing the camera to ensure continuity.
                    </li>
                  </ul>
                </v-card-text>
              </v-card>
            </v-tab-item>
            <!-- UPLOADING -->
            <v-tab-item>
              <v-card flat>
                <v-card-text class="black--text body-1">
                  <div class="text-h5">Uploading Photos to FPE</div>

                  <v-divider class="my-4"></v-divider>
                  <div class="text-h6">Coming Soon!</div>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'UserGuide',
  data () {
    return {
      tab: 0
    }
  }
}
</script>

<style>
</style>
