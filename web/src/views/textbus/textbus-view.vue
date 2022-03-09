<template>
<div class="tb-container">
  <div ref="editorEl"></div>
</div>
</template>

<script setup lang="ts">
import { createEditor } from '@textbus/editor'
import { onMounted, ref } from 'vue';
import '@textbus/editor/bundles/textbus.min.css'

const editorEl = ref<HTMLElement>()
onMounted(() => {
  const editor = createEditor(editorEl.value, {
    theme: 'light'
  })
})

</script>

<style scoped lang="scss">
.tb-container {
  width: 600px;
  height: 570px;
}
:deep(.textbus-container) {
  height: 570px;
  border-radius: 0px
}
</style>