<template>
  <div class="ui-header" :style="systemColor">
    <button class="close-button" @click="clickClose"></button>
    <button class="home-button" @click="clickHome"></button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';
import { IpcRendererService } from './services/IpcRenderer.service';

function clickClose() {
  IpcRendererService.Ins.sendCloseMsg()
}

const router = useRouter()
function clickHome() {
  router.push('/')
}

const systemColor = ref('background-color: rgb(167, 167, 167);')
async function initSystemColor() {
  const color = await IpcRendererService.Ins.invokeToGetSystemColor()
  systemColor.value = `background-color: ${color};`
}
initSystemColor()
</script>

<style scoped lang="scss">
$common-height: 30px;
* {
  transition-timing-function: ease-in-out;
  transition-duration: 0.1s;
}
.ui-header {
  z-index: 66;
  -webkit-app-region: drag;
  width: 100%;
  height: $common-height;
  border-radius: 10px 10px 0px 0px;
  position: sticky;
  top: 0px;
}
button {
  z-index: 67;
  outline: none;
  border: none;
  background-color: transparent;
  -webkit-app-region: no-drag;
  cursor: pointer;
  height: $common-height;
  width: $common-height;
}
.close-button {
  height: $common-height;
  width: $common-height;
  background-image: url(./assets/CloseCircleOutline.svg);
  &:hover {
    background-image: url(./assets/CloseCircleSharp.svg);
  }
  &:active {
    background-image: url(./assets/CloseCircleOutline.svg);
  }
}
.home-button {
  margin-left: 5px;
  background-image: url(./assets/HomeOutline.svg);
  &:hover {
    background-image: url(./assets/Home.svg);
  }
  &:active {
    background-image: url(./assets/HomeSharp.svg);
  }
}
</style>