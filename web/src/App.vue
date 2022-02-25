<template>
  <nav>
    <button @click="clickMe">应用关闭</button>
    <button @click="shutdown">10分钟后关机</button>
    <button @click="cancelShutdown">取消自动关机</button>
  </nav>
  <router-view/>
</template>

<script setup lang="ts">
function clickMe() {
  window.ipcRenderer.sendCloseMsg()
}

function shutdown() {
  window.ipcRenderer.sendShutdownMsg(600)
}

function cancelShutdown() {
  window.ipcRenderer.sendShutdownMsg(-1)
}
</script>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}

button {
  margin: 0px 10px;
}
</style>
