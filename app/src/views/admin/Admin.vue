<template>
  <v-container>
    <v-row justify="space-around">
      <v-col cols="12">
        <v-card elevation="4" class="pb-2">
          <v-toolbar flat dense color="grey lighten-3">
            <v-toolbar-title class="text-h5">
              Administrative Dashboard
            </v-toolbar-title>
          </v-toolbar>
          <v-tabs class="elevation-2 mb-4" grow :vertical="$vuetify.breakpoint.mobile">
            <v-tab :to="{ name: 'adminRequests' }" exact>
              <v-icon left>mdi-account-plus</v-icon> Account Requests
            </v-tab>
            <v-tab :to="{ name: 'adminUsers' }" exact>
              <v-icon left>mdi-account-group</v-icon> Users
            </v-tab>
          </v-tabs>
          <router-view></router-view>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
export default {
  name: 'Admin'
}
</script>
