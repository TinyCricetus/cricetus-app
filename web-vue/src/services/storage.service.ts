enum StorageKey {
  Markdown = 'markdown-save'
}

export class StorageService {
  setMarkdownContent(content: string) {
    window.localStorage.setItem(StorageKey.Markdown, content)
  }

  getMarkdownContent() {
    return window.localStorage.getItem(StorageKey.Markdown)
  }
}

export default new StorageService()