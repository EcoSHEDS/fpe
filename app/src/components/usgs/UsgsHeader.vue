<template>
  <header id="navbar" class="header-nav" role="banner">
    <div class="tmp-container">
      <div class="header-search">
        <a class="logo-header" href="https://www.usgs.gov/" title="USGS Home">
          <img src="img/usgs-logo.png" alt="USGS" class="img" border="0" />
        </a>
        <a href="http://usgs.gov/apps/ecosheds" class="ecosheds-link">
          <v-icon left color="white" small>mdi-chevron-left</v-icon><span>EcoSHEDS</span>
        </a>
      </div>
    </div>
  </header>
</template>

<style scoped>
a.ecosheds-link {
  position: absolute;
  top: 0;
  right: 0;
  margin-top:8px;
  margin-right:8px;
  color:white;
  font-weight: bold;
  border-radius: 5px;
  padding: 5px;
}
a.ecosheds-link > span {
  vertical-align: middle;
}
a.ecosheds-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

</style>
