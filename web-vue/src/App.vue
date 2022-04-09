<template>
  <NConfigProvider :locale="zhCN" :date-locale="dateZhCN">
    <div class="main-container">
      <Header></Header>
      <NMessageProvider placement="top">
        <router-view />
      </NMessageProvider>
    </div>
  </NConfigProvider>
</template>

<script setup lang="ts">
import Header from './header.vue'
import { NConfigProvider, zhCN, dateZhCN, NMessageProvider } from 'naive-ui'
</script>

<style lang="scss">
@font-face {
  font-family: "Cool";
  src: url(./assets/fonts/cool.ttf) format("truetype");
}

@font-face {
  font-family: "Monaco";
  src: url(./assets/fonts/Monaco-1.ttf) format("truetype");
}

body {
  margin: 0px;
  padding: 0px;
  overflow: hidden;

  font-size: 16px;
  font-family: "Microsoft YaHei", "Monaco", Helvetica, Arial, sans-serif;
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
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
}
</style>
