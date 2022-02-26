<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
    <div class="main-container">
      <Header></Header>
      <NMessageProvider placement="bottom">
        <router-view />
      </NMessageProvider>
    </div>
  </NConfigProvider>
</template>

<script setup lang="ts">
import Header from './Header.vue'
import { NConfigProvider, zhCN, dateZhCN, NMessageProvider } from 'naive-ui'
</script>

<style lang="scss">
body {
  margin: 0px;
  padding: 0px;
}
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
ul,
li {
  list-style: none;
  margin-block-start: 0;
  margin-block-end: 0;
  margin-inline-start: 0px;
  margin-inline-end: 0px;
  padding-inline-start: 0px;
}
.main-container {
  position: relative;
  width: 600px;
  height: 600px;
  background-color: #444;
  margin: 0 auto;
  border-radius: 10px;
}
</style>
