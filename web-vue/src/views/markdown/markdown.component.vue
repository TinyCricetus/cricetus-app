<template>
  <div>
    <textarea type="text" class="input-area" v-model="content" />
    <button @click="onClickTransform">转换</button>
    <div v-html="mdContent" class="md-content"></div>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { ref } from 'vue';

const md = new MarkdownIt()
const content = ref('')
const mdContent = ref('')

function onClickTransform() {
  mdContent.value = md.render(content.value)
  console.log(mdContent.value)
}
</script>

<style lang="scss">
.input-area {
  max-width: 100%;
  min-width: 100%;
  max-height: 150px;
  min-height: 150px;
  box-sizing: border-box;
}
.md-content {
  pre {
    code {
      font-family: "Monaco";
    }
    background-color: antiquewhite;
    padding: 10px;
    border-radius: 10px;
  } 
}
</style>