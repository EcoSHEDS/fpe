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
          <v-list-item :to="{ name: 'home' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-home</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Home</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

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

          <v-list-item v-if="user && user.isAnnotator" :to="{ name: 'annotator' }" class="pr-8">
            <v-list-item-icon>
              <v-icon>mdi-pencil-box-outline</v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>Annotate</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item v-if="!user" :to="{ name: 'request' }" class="pr-8">
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

          <v-list-item v-if="user" @click="logout" to="" exact class="pr-8">
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

      <v-btn text :to="{ name: 'home' }" class="mx-2" exact>
        <v-icon small left>mdi-home</v-icon> Home
      </v-btn>
      <v-btn text :to="{ name: 'about' }" class="mx-2">
        <v-icon small left>mdi-information-outline</v-icon> About
      </v-btn>
      <v-btn text :to="{ name: 'user-guide' }" class="mx-2">
        <v-icon small left>mdi-book</v-icon> User Guide
      </v-btn>
      <v-btn text :to="{ name: 'explorer' }" class="mx-2">
        <v-icon small left>mdi-image-multiple-outline</v-icon> Photo Explorer
      </v-btn>

      <v-divider vertical class="mx-4"></v-divider>

      <v-btn text v-if="user && user.isAnnotator" :to="{ name: 'annotator' }" class="mx-2">
        <v-icon small left>mdi-pencil-box-outline</v-icon> Annotate
      </v-btn>

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

          <v-list-item @click="logout" to="" exact class="pr-12">
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
          <v-list-item :to="{ name: 'request' }" class="pr-12">
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
      <v-container fluid>
        <v-row justify="space-around">
          <v-col cols="12" xl="10">
            <router-view></router-view>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-snackbar
      v-model="snackbar.show"
      :timeout="snackbar.timeout"
      :color="snackbar.color"
      :top="true"
      elevation="12"
      style="margin-top:65px;z-index:5002"
      :light="true"
      outlined
      text>
      <span class="font-weight-bold">{{ snackbar.text }}</span>
      <template v-slot:action="{ attrs }">
        <v-btn :color="snackbar.color" icon text v-bind="attrs" @click="snackbar.show = false">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </template>
    </v-snackbar>

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
    snackbar: {
      show: false,
      color: 'primary',
      text: null,
      timeout: 5000
    }
  }),
  computed: {
    ...mapGetters(['user'])
  },
  mounted () {
    evt.$on('notify', this.notify)
  },
  beforeDestroy () {
    evt.$off('notify', this.notify)
  },
  methods: {
    notify (color, text) {
      this.snackbar.color = color
      this.snackbar.text = text
      this.snackbar.show = true
    },
    async logout () {
      try {
        await this.$Amplify.Auth.signOut()
        evt.$emit('notify', 'success', 'You have been logged out')
        evt.$emit('authState', { state: 'signedOut' })
        this.$router.push({ name: 'home' })
      } catch (err) {
        console.log(err)
        evt.$emit('notify', 'error', 'Failed to log out')
      }
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
