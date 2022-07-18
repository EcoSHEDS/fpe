<template>
  <v-app>
    <UsgsHeader></UsgsHeader>

    <!-- MOBILE NAVBAR -->
    <v-app-bar app dense color="indigo darken-2" dark absolute style="z-index:1001;margin-top:68px" v-if="$vuetify.breakpoint.mobile">
      <router-link :to="{ name: 'home' }" class="toolbar-title">
        <v-toolbar-title class="headline">
          <v-icon left>mdi-camera-outline</v-icon>
          Flow Photo Explorer
        </v-toolbar-title>
      </router-link>

      <v-spacer></v-spacer>

      <v-menu
        left
        bottom
        offset-y
      >
        <template v-slot:activator="{ on, attrs }">
          <v-app-bar-nav-icon v-bind="attrs" v-on="on"></v-app-bar-nav-icon>
        </template>

        <v-list>
          <v-list-item :to="{ name: 'about' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-information-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>About</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'user-guide' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-book</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>User Guide</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'explorer' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-image-multiple-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Photo Explorer</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>

          <v-list-item v-if="!user" :to="{ name: 'requestAccount' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Request Account</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="!user" :to="{ name: 'login' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-login</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Log In</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user">
            <v-list-item-content>
              <v-list-item-title class="text-left">
                <span class="text--secondary text-caption mb-2">Logged In</span><br>
                {{user.attributes.name | truncate(40)}}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user" :to="{ name: 'manage' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-upload</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Upload</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user && user.isAdmin" :to="{ name: 'admin' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-badge-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Admin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user" :to="{ name: 'account' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-cogs</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="user" @click="logout" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Log Out</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- NORMAL NAVBAR -->
    <v-app-bar app dense color="indigo darken-2" dark absolute style="z-index:1001;margin-top:68px" v-else>
      <router-link :to="{ name: 'home' }" class="toolbar-title">
        <v-toolbar-title class="headline">
          <v-icon left>mdi-camera-outline</v-icon>
          Flow Photo Explorer
        </v-toolbar-title>
      </router-link>

      <v-spacer></v-spacer>

      <v-btn text :to="{ name: 'about' }" class="mx-2">
        <v-icon small left>mdi-information-outline</v-icon> About
      </v-btn>
      <v-btn text :to="{ name: 'user-guide' }" class="mx-2">
        <v-icon small left>mdi-book</v-icon> User Guide
      </v-btn>
      <v-btn text :to="{ name: 'explorer' }" class="mx-2">
        <v-icon small left>mdi-image-multiple-outline</v-icon> Photo Explorer
      </v-btn>
      <!-- <v-btn text :to="{ name: 'models' }" class="mx-2">
        <v-icon small left>mdi-brain</v-icon> AI Models
      </v-btn> -->

      <v-divider vertical class="mx-4"></v-divider>

      <v-btn text class="mx-2" v-if="user" :to="{ name: 'manage' }">
        <v-icon small left>mdi-upload</v-icon> Upload
      </v-btn>
      <v-menu
        left
        bottom
        offset-y
      >
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            text
            dark
            v-bind="attrs"
            v-on="on"
            class="ml-2"
          >
            <v-icon left>mdi-account</v-icon> Account
          </v-btn>
        </template>

        <!-- LOGGED IN -->
        <v-list v-if="user">
          <v-list-item>
            <v-list-item-content>
              <v-list-item-title class="text-left">
                <span class="text--secondary text-caption mb-2">Logged In</span><br>
                {{user.attributes.name | truncate(40)}}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-divider></v-divider>
          <v-list-item v-if="user && user.isAdmin" :to="{ name: 'admin' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-badge-account</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Admin</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'account' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-cogs</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item @click="logout" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-logout</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Log Out</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>

        <!-- NOT LOGGED IN -->
        <v-list v-else>
          <v-list-item :to="{ name: 'requestAccount' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-account-plus</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Request Account</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item :to="{ name: 'login' }" class="pr-12">
            <v-list-item-icon>
              <v-icon>mdi-login</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Log In</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main>
      <v-container>
        <v-row justify="space-around">
          <v-col cols="12" xl="10">
            <router-view></router-view>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <UsgsFooter></UsgsFooter>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex'

import evt from '@/events'
import UsgsHeader from '@/components/usgs/UsgsHeader'
import UsgsFooter from '@/components/usgs/UsgsFooter'

export default {
  name: 'App',
  components: {
    UsgsHeader,
    UsgsFooter
  },
  data: () => ({
  }),
  computed: {
    ...mapGetters(['user'])
  },
  methods: {
    logout () {
      this.$Amplify.Auth.signOut()
        .then(() => {
          return evt.$emit('authState', { state: 'signedOut' })
        })
        .catch((err) => {
          console.log(err)
          alert('Error occurred trying to log out')
        })
    }
  }
}
</script>

<style>
.toolbar-title {
  color: inherit !important;
  text-decoration: inherit !important;
}
</style>
