<template>
  <div class="song-container">
    <ul class="song-list">
      <li v-for="song in songHistory" :key="song.id">
        <NPopover trigger="hover">
          <template #trigger>
            <NButton strong secondary :type="getButtonType(Math.random())" @click="clickSongName(song.name)">{{ song.name }}</NButton>
          </template>
          <span>{{ song.info }}</span>
        </NPopover>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { IpcRendererService } from '@/services/ipc-renderer.service'
import { ref } from 'vue'
import { NPopover, NButton, useMessage } from 'naive-ui'

interface SongData {
  name: string
  info: string
  id: string
}

const songHistory = ref<SongData[]>([])
async function initCloudMusicHistory() {
  const history = await IpcRendererService.Ins.invokeToGetCloudMusicHistory()
  const songList = history.map((songItem) => {
    const name = songItem.track.name || 'unknown'
    const artists = songItem.track.artists?.map((item: {name: string}) => { return item.name }) || []
    const date = new Date(songItem.time).toLocaleDateString()
    return {
      name: name,
      info: '艺术家：' + artists.join(' & ') + '\xa0\xa0\xa0上次欣赏：' + date,
      id: songItem.id
    } as SongData
  })
  songHistory.value = songList
}
initCloudMusicHistory()

type ButtonType = 'info' | 'primary' | 'warning' | 'error'
function getButtonType(sed: number): ButtonType {
  const sedNum = Math.floor(sed * 1000) % 4
  const typeMap: { [key: string]: ButtonType } = {
    '0': 'info',
    '1': 'primary',
    '2': 'warning',
    '3': 'error'
  }
  return typeMap[sedNum + '']
}

const message = useMessage()
function clickSongName(name: string) {
  window.navigator.clipboard.writeText(name)
  message.success('歌曲复制成功！')
}
</script>

<style lang="scss" scoped>
.song-container {
  width: 600px;
  height: 570px;
  overflow-y: scroll;
  overflow-x: hidden;
  background-color: white;
}
.song-list {
  width: 600px;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  li {
    margin: 10px;
  }
}
</style>