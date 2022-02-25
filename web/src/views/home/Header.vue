<template>
  <div class="ui-header">
    <button class="close-button" @click="clickClose">关闭</button>
  </div>
</template>

<script setup lang="ts">
function clickClose() {
  window.ipcRenderer.sendCloseMsg()
}
</script>

<style scoped lang="scss">
$common-height: 30px;
* {
  transition-timing-function: ease-in-out;
  transition-duration: 0.1s;
}  
.ui-header {
  -webkit-app-region: drag;
  width: 100%;
  height: $common-height;
  background-color: gray;
}
.close-button{
  -webkit-app-region: no-drag;
  position: absolute;
  right: 0px;
  cursor: pointer;
  height: $common-height;
  width: $common-height * 2;
  font-family: "Microsoft YaHei";
  &:hover {
    font-size: large;
    font-weight: bold;
  }
}
</style>