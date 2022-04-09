<template>
  <div class="md-container">
    <NTabs type="line" animated :on-update:value="onTabsUpdate">
      <NTabPane :name="TabType.Editor" tab="编辑">
        <textarea
          type="text"
          class="md-input-area"
          v-model="content"
          placeholder="欢迎使用markdown编辑器"
        />
      </NTabPane>
      <NTabPane :name="TabType.Preview" tab="预览">
        <div v-html="mdContent" class="md-content"></div>
      </NTabPane>
    </NTabs>
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { NTabs, NTabPane } from 'naive-ui'
import { Subject, debounceTime } from 'rxjs'
import highLight from 'highlight.js'

import storage from '../../services/storage.service'
import { TEMPLATE_STRING } from './example'

enum TabType {
  Editor = 'tab-editor',
  Preview = 'tab-preview'
}

const md = new MarkdownIt({
  linkify: true,
  highlight: function (str, lang) {
    if (lang && highLight.getLanguage(lang)) {
      try {
        return highLight.highlight(lang, str).value;
      } catch (__) { }
    }

    return ''; // 使用额外的默认转义
  }
})

const activatedTab = ref<TabType>(TabType.Editor)
const content = ref('')
const mdContent = ref('')

const userEditorSubject = new Subject<string>()

watch(activatedTab, (tab: TabType) => {
  if (tab === TabType.Preview) {
    transformMarkdown()
  }
})

watch(content, (value: string) => {
  userEditorSubject.next(value)
})

onMounted(() => {
  content.value = storage.getMarkdownContent()

  if (!content.value) {
    content.value = TEMPLATE_STRING
  }
})

const userEditorSubscription = userEditorSubject.pipe(debounceTime(5000)).subscribe((value) => {
  storage.setMarkdownContent(value)
})

onUnmounted(() => {
  userEditorSubscription.unsubscribe()
})

function transformMarkdown() {
  mdContent.value = md.render(content.value)
}

function onTabsUpdate(value: TabType) {
  activatedTab.value = value
}
</script>

<style lang="scss">
@import "@/assets/css/common.scss";
@import "highlight.js/scss/atom-one-dark.scss";

$page-height: $root-height - 92px;

::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}
::-webkit-scrollbar-thumb {
  border-radius: 5px;
  background: #bbbbc4;
}
::-webkit-scrollbar-track {
  background-color: #DFDFDE;
  border-radius: 5px;
}

.md-container {
  background-color: white;
}
.md-input-area {
  width: $root-width;
  // 需要减去顶不切换栏的高度

  height: $page-height;
  box-sizing: border-box;
  resize: none;
  outline: none;
  font-size: 20px;
  border: none;
  font: inherit;
  padding: 10px;
}
.n-tabs .n-tab-pane {
  padding-top: 0px;
}
.n-tabs-nav-scroll-content {
  margin-left: 10px;
}

.md-content {
  max-width: $root-width;
  height: $page-height;
  overflow: auto;
  padding: 10px;

  pre {
    code {
      font-family: "Monaco";
    }
    padding: 1rem;
    background-color: #f5f8fa;
    border-radius: 5px;
  }
  blockquote {
    margin-block-start: 0px;
    margin-block-end: 0px;
    margin-inline-start: 0px;
    margin-inline-end: 0px;
    padding: 14px;
    border-left: 1px solid #e2e8f0;
    border: 1px solid #e2e8f0;
    border-left-width: 6px;
    border-radius: 6px;
  }
  table {
    border-collapse: collapse;
    border: 1px solid silver;
    tr {
      th {
        background-color: white;
      }

      border-bottom: 1px solid silver;
      &:nth-child(2n-1) {
        background-color: #e2e8f0;
      }
      &:nth-child(2n) {
        background-color: #f5f5f5;
      }
    }
  }
}
</style>