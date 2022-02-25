<template>
  <div class="main-container">
    <Header></Header>
    <ul class="grid-menu">
      <li v-for="item in menuItems" :key="item.title">
        <span class="grid-content">{{ item.content }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import Header from './Header.vue'

const menuItems = [
  { title: '1', content: '自动关机' },
  { title: '2', content: '更多功能，敬请期待...' },
  { title: '3', content: '更多功能，敬请期待...' },
  { title: '4', content: '更多功能，敬请期待...' }
]
</script>

<style scoped lang="scss">
$app-width: 600px;
$app-height: 600px;
* {
  user-select: none;
}
.main-container {
  position: relative;
  width: $app-width;
  height: $app-height;
}
.grid-menu {
  $grid-width: $app-width / 2 - 2px;
  $grid-height: ($app-height - 30px) / 2 - 2px;

  display: grid;
  grid-template-columns: 300px 300px;
  grid-template-rows: 285px 285px;
  li {
    background-image: url(./assets/menu_item_bg.png);
    cursor: pointer;
    display: inline-block;
    overflow: hidden;
    border: 1px solid gray;
    width: $grid-width;
    height: $grid-height;
    background-color: aqua;
    &:hover {
      .grid-content {
        margin-top: 0px;
      }
    }
    .grid-content {
      text-align: center;
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