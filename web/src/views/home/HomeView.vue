<template>
  <div>
    <ul class="grid-menu">
      <li v-for="item in menuItems" :key="item.index" @click="item.itemFunction">
        <span class="grid-content">{{ item.content }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
const menuItems = [
  { index: 1, content: '自动关机部署', itemFunction: () => { router.push('/shutdown') } },
  { index: 2, content: '网易云听歌记录', itemFunction: () => { router.push('/history') } },
  { index: 3, content: '更多功能，敬请期待...' },
  { index: 4, content: '更多功能，敬请期待...' }
]
</script>

<style scoped lang="scss">
$app-width: 600px;
$app-height: 600px;
* {
  user-select: none;
}
.grid-menu {
  $grid-width: $app-width / 2;
  $grid-height: ($app-height - 30px) / 2;

  display: grid;
  grid-template-columns: 300px 300px;
  grid-template-rows: 285px 285px;
  li {
    cursor: pointer;
    display: inline-block;
    overflow: hidden;
    width: $grid-width;
    height: $grid-height;
    background-color: aqua;
    &:nth-child(1) {
      background-image: url(./assets/1.png);
    }
    &:nth-child(2) {
      background-image: url(./assets/2.png);
    }
    &:nth-child(3) {
      border-radius: 0px 0px 0px 10px;
      background-image: url(./assets/3.png);
    }
    &:nth-child(4) {
      border-radius: 0px 0px 10px 0px;
      background-image: url(./assets/4.png);
    }
    &:hover {
      .grid-content {
        margin-top: 0px;
      }
    }
    .grid-content {
      text-align: center;
      color: rgb(150, 150, 150);
      line-height: $grid-height;
      font-size: 30px;
      opacity: 0.8;
      transition-timing-function: ease-out;
      transition-duration: 0.2s;
      display: inline-block;
      width: $grid-width;
      height: $grid-height;
      background-color: black;
      margin-top: $grid-height;
    }
  }
}
</style>