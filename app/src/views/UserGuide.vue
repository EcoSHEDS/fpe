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

          <v-tabs :vertical="$vuetify.breakpoint.mobile" grow v-model="tab" class="pt-4">
            <v-tab>
              <v-icon left>
                mdi-information-outline
              </v-icon>
              Background
            </v-tab>
            <v-tab>
              <v-icon left>
                mdi-camera
              </v-icon>
              Equipment
            </v-tab>
            <v-tab>
              <v-icon left>
                mdi-target
              </v-icon>
              Field Methods
            </v-tab>
            <v-tab>
              <v-icon left>
                mdi-upload
              </v-icon>
              Uploading Photos
            </v-tab>
          </v-tabs>

          <v-divider></v-divider>

          <v-tabs-items v-model="tab">
            <!-- BACKGROUND -->
            <v-tab-item>
              <v-card flat>
                <v-card-text class="black--text body-1">
                  <div class="text-h5">Background</div>

                  <!-- <v-img src="img/user-guide/avery-brook.jpg" alt="Photo of Avery Brook" class="my-4"></v-img> -->
                  <video src="video/AIML_FINALDRAFT_v3_optim.mp4" controls width="100%" poster="video/AIML_FINALDRAFT_v3_optim.jpg" class="my-4"></video>

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

                  <v-img src="img/user-guide/secure-camera.jpg" alt="Deployed game camera" class="my-4"></v-img>

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
                      <v-img src="img/user-guide/security-box.jpg" alt="Security box" class="my-4" max-width="200px"></v-img>
                    </li>
                    <li>
                      A <span class="font-weight-bold">lock</span> is used to to secure the camera in the security box.<br>
                      <v-img src="img/user-guide/security-lock.jpg" alt="Security lock" class="my-4" max-width="200px"></v-img>
                    </li>
                    <li>
                      A <span class="font-weight-bold">security cable</span> is used to prevent theft by tethering the camera security box to a tree or other fixture. This cable is different from a tree strap that secures the camera to the tree.<br>
                      <v-img src="img/user-guide/security-cable.jpg" alt="Security cable" class="my-4" max-width="200px"></v-img>
                    </li>
                  </ul>

                  <v-divider class="my-4"></v-divider>

                  <div class="text-h6 mb-4">Camera Mounts</div>
                  <p>
                    There are a variety of ways to mount cameras: tree straps, tree screws, swivel mounts, fence T-posts, and stand-alone ground mounts to name a few. A good mount is critical to collecting consistent time lapse images, which do not shift due to wind or other external forces. It is <span class="font-weight-bold">important for the field-of-view to be as consistent as possible</span> across all images at each station.
                  </p>

                  <div class="font-weight-bold mb-4">Tree Strap</div>
                  <v-img src="img/user-guide/tree-strap.jpg" alt="Tree strap" class="my-4" max-width="400px"></v-img>
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
                  <v-img src="img/user-guide/tree-screw.jpg" alt="Tree screw" class="my-4" max-width="400px"></v-img>
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
                  <v-img src="img/user-guide/swivel-mount.jpg" alt="Swivel mount" class="my-4" max-width="400px"></v-img>
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
                  <v-img src="img/user-guide/fence-t-post.jpg" alt="Fence T-Post" class="my-4" max-width="400px"></v-img>
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
                  <v-img src="img/user-guide/ground-mount.jpg" alt="Ground Mount" class="my-4" max-width="400px"></v-img>
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

                  <v-img src="img/user-guide/image-perspective.png" alt="Diagram of camera setup" class="my-4"></v-img>

                  <p>When selecting a location to mount your camera, ensure that:</p>
                  <ul class="mb-4">
                    <li>The camera will have a clear view of the river year round. Avoid areas with dense vegetation that may obscure the camera view, especially in summer.</li>
                    <li>The camera images capture the complete bankfull width of the stream channel.</li>
                    <li>Aim for the images to contain approximately 80% water and 20% neighboring landscape (i.e., forest)</li>
                    <li>The images will contain consistent lighting conditions and will not be strongly impacted by shadows changing over the course of the day.</li>
                    <li>The camera may point upstream, downstream or perpendicular to the river. We are currently evaluating which perspective provides the best data for model performance.</li>
                  </ul>

                  Here is an example of an ideal camera view:

                  <v-img src="img/user-guide/image-ideal.png" alt="Example of ideal image perspective" class="my-4"></v-img>

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
                  <p>To upload photos to the USGS Flow Photo Explorer, please follow these three steps.</p>
                  <ol class="font-weight-bold">
                    <li><a @click="$vuetify.goTo('#upload-account', { offset: 0 })">Create Account</a></li>
                    <li><a @click="$vuetify.goTo('#upload-station', { offset: 0 })">Create Station</a></li>
                    <li><a @click="$vuetify.goTo('#upload-photos', { offset: 0 })">Upload Photos</a></li>
                    <li><a @click="$vuetify.goTo('#upload-pii', { offset: 0 })">Review PII Detections</a></li>
                  </ol>

                  <v-divider class="my-4"></v-divider>
                  <div class="text-h5" id="upload-account">Step 1: Create Account</div>
                  <p>To upload photos to FPE, you must first <strong>request an account</strong> by going to <code>Account > Request Account</code> on the navigation bar.</p>

                  <v-img src="img/user-guide/upload/account-request-button.png" alt="Screenshot of Account Request button" class="my-4 mx-auto elevation-2" style="border-radius:5px" max-width="500px"></v-img>

                  <p>Next, <strong>submit the form</strong> with your name, email, affiliation and brief description of your monitoring program. Once submitted, this form will be sent to the FPE team for approval. New accounts will be approved within 2 business days. Once approved, you will be sent an automated email with a temporary password to use in the next step. <strong>If you do not receive a temporary password within 2 days</strong>, please check your spam folder first and then contact us at <a href="mailto:ecosheds@usgs.gov">ecosheds@usgs.gov</a> for assistance.</p>

                  <v-img src="img/user-guide/upload/account-request-form.png" alt="Screenshot of Account Request form" class="my-4 mx-auto" max-width="500px"></v-img>

                  <p>After you receive your temporary password, go to the <code>Account > Login</code> page to log in.</p>

                  <v-img src="img/user-guide/upload/account-login-button.png" alt="Screenshot of Login button" class="my-4 mx-auto elevation-2" style="border-radius:5px" max-width="500px"></v-img>

                  <p><strong>Login</strong> using your temporary password.</p>

                  <v-img src="img/user-guide/upload/account-login-form.png" alt="Screenshot of Login form" class="my-4 mx-auto" max-width="500px"></v-img>

                  <p><strong>Fill out the form</strong> to set a permanent password for your account.</p>

                  <v-img src="img/user-guide/upload/account-login-password.png" alt="Screenshot of Permanent Password Form" class="my-4 mx-auto" max-width="500px"></v-img>

                  <p>You will then be logged in to you account, and taken to the <code>Upload</code> page.</p>

                  <v-divider class="my-4"></v-divider>
                  <div class="text-h5" id="upload-station">Step 2: Create Station</div>

                  <p>To create a station, <strong>click the <code>+ NEW STATION</code> button</strong> on the <code>Upload</code> page.</p>

                  <v-img src="img/user-guide/upload/station-new-button.png" alt="Screenshot of New Station button" class="my-4 mx-auto"></v-img>

                  <p><strong>Fill out the form</strong> containing a brief name, description, latitude/longitude, and time zone. If the station is associated with an existing USGS NWIS station, enter the station ID to automatically link any available flow or stage data to this station. Click the private checkbox to prevent the station from appearing on the public Photo Explorer page (note that the flow model can still be used at private stations).</p>

                  <v-img src="img/user-guide/upload/station-new-form.png" alt="Screenshot of New Station form" class="my-4 mx-auto elevation-2" max-width="500" style="border-radius:5px"></v-img>

                  <p>After the form is submitted, the station will be created and should appear in the <code>Stations</code> table on the <code>Upload</code> page.</p>

                  <v-img src="img/user-guide/upload/station-new-row.png" alt="Screenshot of New Station added to Stations table" class="my-4"></v-img>

                  <v-divider class="my-4"></v-divider>
                  <div class="text-h5" id="upload-photos">Step 3: Upload Photos</div>

                  <p>To upload photos for a station, <strong>click on it's row</strong> in the <code>Stations</code> table on the <code>Upload</code> page, which will take you to the <code>Manage Station</code> page. Here, you can edit the station information, delete the station, and upload photos or observed flow data for that station.</p>

                  <p><strong>Click the Photos</strong> tab to upload a new batch of photos for the selected station.</p>

                  <v-img src="img/user-guide/upload/photos-button.png" alt="Screenshot of Manage Station page with Photos button" class="my-4"></v-img>

                  <p>Before you can upload photos, <strong>click the <code>Enter Photos Source and Methodology</code> button</strong> to describe how the photos were collected.</p>

                  <v-img src="img/user-guide/upload/photos-method-button.png" alt="Screenshot of Photo tab on Manage Station page" class="my-4"></v-img>

                  <p><strong>Fill out the form</strong> with the source of the photos (if different from your own affiliation), the methodology used to collect the photos (e.g. type of camera used or other sources), and a citation to the QAPP/SOP if available.</p>

                  <v-img src="img/user-guide/upload/photos-method-form.png" alt="Screenshot of Photo Methodology form" class="my-4 mx-auto elevation-2" max-width="500" style="border-radius:5px"></v-img>

                  <p>After the form is submitted, <strong>click the <code>Upload Photos</code> button</strong> to open the multi-step upload form.</p>

                  <v-img src="img/user-guide/upload/photos-upload-button.png" alt="Screenshot of Upload Photos button" class="my-4 mx-auto"></v-img>

                  <p><strong>Read the instructions</strong> to be sure your photos satify all requirements, then <strong>click continue</strong>.</p>

                  <v-img src="img/user-guide/upload/photos-form-instructions.png" alt="Screenshot of upload instructions" class="my-4 mx-auto"></v-img>

                  <p><strong>Click the input field</strong> to select the photo files on your computer (note that multiple files can be selected). After the files are selected, the form will automatically check that each file is a valid JPEG image with embedded EXIF data.</p>

                  <v-img src="img/user-guide/upload/photos-form-files-select.png" alt="Screenshot of photo select form showing files being validated" class="my-4 mx-auto"></v-img>

                  <p>If all photos are valid, <strong>click Continue</strong>.</p>

                  <v-img src="img/user-guide/upload/photos-form-files-valid.png" alt="Screenshot of selected photos after validation is complete" class="my-4 mx-auto"></v-img>

                  <p><strong>Select the UTC offset</strong> for the timezone associated with the timestamp of each photo. This setting is important for converting the photo timestamps to UTC (aka GMT) for storage in the database. If you typically set the camera clock to the local time on your watch or phone, then choose the standard or daylight savings version of your local timezone that was in effect when you last set the camera clock. For example, if you last set the camera clock in the summer and you are in US/Eastern time zone, then choose UTC-04 (EDT) for eastern daylight time.</p>

                  <v-img src="img/user-guide/upload/photos-form-timestamp.png" alt="Screenshot of timestamp settings" class="my-4 mx-auto"></v-img>

                  <p>After selecting a UTC offset, <strong>verify that the EXIF, UTC, and local timestamps are correct</strong> as shown for the first photo in this batch and then <strong>click Continue</strong>. In general, the EXIF timestamp should match the timestamp shown within the image itself, the UTC timestamp should then be shifted by the selected UTC offset (e.g. 5 hours ahead for EST or CDT), and the local timestamp should be the same as the EXIF data with the correct timezone abbreviation appended at the end. The local timestamp may differ from the EXIF timestamp if the camera clock was set based on a UTC offset that differed from the local standard or daylight savings time at the start of the deployment. For example, if the camera clock was last set during daylight savings (summer), but it was not deployed until later in the year when local standard time was in effect (winter), then the photo timestamps would be in UTC-04 (EDT) even during the winter when the local time was actually in UTC-05 (EST). In this case, the correct local timestamp of the first photo should be one hour behind the EXIF timestamp.</p>

                  <p>After verifying the timestamps are correctly adjusted, <strong>enter any additional information</strong> specific to this batch of images, especially any changes that may have occurred related to the positioning or deployment of the camera.</p>

                  <v-img src="img/user-guide/upload/photos-form-metadata.png" alt="Screenshot of additional information form" class="my-4 mx-auto"></v-img>

                  <p>Lastly, <strong>review and agree to the upload conditions</strong>, and then <strong>click Start Upload</strong> to begin uploading the photos to the FPE database.</p>

                  <v-img src="img/user-guide/upload/photos-form-ready.png" alt="Screenshot of additional information form" class="my-4 mx-auto"></v-img>

                  <p>Now <strong>wait while the photos are uploaded</strong>. If you have a large batch of photos, this process could take an hour or more depending on your internet speed. You can minimize this browser window and work on other things, but <strong>do not close your web browser or this tab</strong> and be sure to change your power settings so your computer does not go to sleep, which will stop the upload.</p>

                  <v-img src="img/user-guide/upload/photos-form-uploading.png" alt="Screenshot of additional information form" class="my-4 mx-auto"></v-img>

                  <p>If an error or network problem occurs or your computer goes to sleep while the files are being uploaded, the form will provide a few options for how to continue. Click the <code>Retry</code> to pick up where it left off and continue trying to upload any remaining files that have not yet been uploaded. Click the <code>Finish</code> button to complete the upload but skip any remaining photos that have not been uploaded yet. Or click <code>Cancel</code> to cancel this entire upload and delete any photos that have already been uploaded.</p>

                  <v-img src="img/user-guide/upload/photos-form-error.png" alt="Screenshot of uploading step when error occurs" class="my-4 mx-auto"></v-img>

                  <p>When all images have been uploaded, you will see a brief confirmation message and then be taken back to the <code>Manage Station</code> page.</p>

                  <v-img src="img/user-guide/upload/photos-form-complete.png" alt="Screenshot of uploading step when complete" class="my-4 mx-auto"></v-img>

                  <p>After the photos are uploaded, a new row will appear in the <code>Photo Sets</code> table on the <code>Manage Station</code> page. The new photo set will initially be in the <code>Queued</code> stage, which indicates the FPE server is preparing to process this set of photos.</p>

                  <v-img src="img/user-guide/upload/photos-queued.png" alt="Screenshot of photo set in queued stage" class="my-4 mx-auto"></v-img>

                  <p>Once the FPE server is ready, the photo set will then automatically move to the <code>Processing</code> stage during which the EXIF data and timestamp will be extracted from each photo file, and a smaller thumbnail version of each photo will be generated. This step can take up to an hour, but unlike the file upload step, it is safe to close your browser and return later.</p>

                  <v-img src="img/user-guide/upload/photos-processing.png" alt="Screenshot of photo set processing stage" class="my-4 mx-auto"></v-img>

                  <p>After all photos are processed, FPE show the <code>Upload Status</code> as <code>Done</code> and the page will show a thumbnail preview along with the filename and local timestamp of each photo in this set. Use the start/end filters to see photos during a specific range, and the up/down arrow buttons to change the order. Click the <v-icon small>mdi-delete</v-icon> button to delete an individual photo, or click the <code>Delete Photo Set</code> button to delete this entire batch.</p>

                  <v-img src="img/user-guide/upload/photos-done.jpg" alt="Screenshot of photo set after processing is complete" class="my-4 mx-auto"></v-img>

                  <v-divider class="my-4"></v-divider>
                  <div class="text-h5" id="upload-pii">Step 4: Review Personal Identifying Information (PII) Detections</div>

                  <p>After the photos are initially processed, they will be scanned for the presence of people or vehicles, which are forms of Personal Identifying Information (PII), using the <a href="https://github.com/microsoft/CameraTraps/blob/main/megadetector.md">MegaDetector</a> objection detection model. The <code>PII Status</code> of the photo set will initially show <code>QUEUED</code> as the PII detector is being loaded. The <code>PII Status</code> will then change to <code>PROCESSING</code> while the photos are being scanned, and finally <code>DONE</code> when the scan is complete.</p>

                  <p>Because PII scanning can take many hours for a large batch of photos, all photos will initially be shown on the public Photo Explorer (unless the station is marked as private). After the scan is complete, photos containing detected PII will <strong>be excluded</strong> from the public Photo Explorer.</p>

                  <p>After the PII scanning is complete (<code>PII Status=DONE</code>), you can review the results by filtering the images for different types of PII using the check boxes above the photo array.</p>

                  <v-img src="img/user-guide/upload/pii-detected.jpg" alt="Screenshot of photo set with PII detection results" class="my-4 mx-auto"></v-img>

                  <p>If the PII detector failed to correctly identify a person or vehicle (false negative), click the PII flag icon to <strong>manually flag the photo</strong>. When a photo is manually flagged, it will not be shown in the public Photo Explorer, similar to photos with auto-detected PII.</p>

                  <v-img src="img/user-guide/upload/photo-pii-on.jpg" alt="Screenshot of photo with manual PII flag" class="my-4 mx-auto" max-width="800"></v-img>

                  <p>If the PII detector incorrectly identified a person or vehicle when there wasn't one (false positive), click the PII flag icon to <strong>ignore the detection</strong>. When a PII detection is ignored, the photo will be shown in the public Photo Explorer.</p>

                  <v-img src="img/user-guide/upload/photo-pii-off.jpg" alt="Screenshot of photo with PII flag ignored" class="my-4 mx-auto" max-width="800"></v-img>

                  <p><strong>Congratulations!</strong> The upload process is complete and you can now view the photos on the <router-link :to="{ name: 'explorer' }">Photo Explorer</router-link> (unless the station is private).</p>
                </v-card-text>
              </v-card>
            </v-tab-item>
          </v-tabs-items>
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
      tab: 3
    }
  }
}
</script>

<style>
</style>
