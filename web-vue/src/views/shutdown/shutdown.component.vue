<template>
  <div class="shutdown-container">
    <div class="time-picker">
      <NTimePicker placeholder="请选择关机时间（时分秒）" :on-update:value="onTimeValueUpdated"></NTimePicker>
    </div>
    <div class="button-list">
      <NButton type="success" @click="activeShutdown">发起关机任务</NButton>
      <NButton type="warning" @click="cancelShutdown">取消自动关机</NButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { NTimePicker, NButton, useMessage } from 'naive-ui'
import { IpcRendererService } from '@/services/ipc-renderer.service';

const timePickerValue = ref(0)
const message = useMessage()

function onTimeValueUpdated(timestamp: number) {
  timePickerValue.value = timestamp
}

function activeShutdown() {
  if (timePickerValue.value <= 0) {
    message.info('请选择时间以部署关机任务')
    return
  }
  let remainSeconds = Math.floor((timePickerValue.value - Date.now()) / 1000)
  if (remainSeconds < 0) {
    remainSeconds = 24 * 60 * 60 + remainSeconds
  }
  IpcRendererService.Ins.sendShutdownMsg(remainSeconds)
  message.success('关机任务已被部署，请留意系统通知栏')
}

function cancelShutdown() {
  IpcRendererService.Ins.sendShutdownMsg(-1)
  message.warning('关机任务已被取消')
}
</script>

<style lang="scss" scoped>
.shutdown-container {
  background-color: #444;
  width: 600px;
  height: 570px;
  padding-top: 200px;
}
.time-picker {
  margin: 0 auto;
  width: 250px;
}
.button-list {
  margin-top: 50px;
  display: flex;
  justify-content: center;
  button {
    width: 100px;
    height: 30px;
    margin: 0px 25px;
  }
}
</style>