import { useEffect, useMemo, useState } from 'react'
import MarkdownIt from 'markdown-it'
import highLight from 'highlight.js'
import storage from '../../services/storage'
import { TEMPLATE_STRING } from './template'
import './markdown.css'
import 'highlight.js/styles/atom-one-dark.css'

type TabType = 'editor' | 'preview'

export default function Markdown() {
  const [activeTab, setActiveTab] = useState<TabType>('editor')
  const [content, setContent] = useState('')

  const md = useMemo(
    () =>
      new MarkdownIt({
        linkify: true,
        highlight: (str: string, lang?: string) => {
          if (lang && highLight.getLanguage(lang)) {
            try {
              return highLight.highlight(str, { language: lang }).value
            } catch {
              return ''
            }
          }
          return ''
        }
      }),
    []
  )

  const rendered = useMemo(() => md.render(content), [md, content])

  useEffect(() => {
    const stored = storage.getMarkdownContent()
    setContent(stored || TEMPLATE_STRING)
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      storage.setMarkdownContent(content)
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [content])

  return (
    <div className="md-container">
      <div className="md-tabs">
        <button
          type="button"
          className={`md-tab ${activeTab === 'editor' ? 'active' : ''}`}
          onClick={() => setActiveTab('editor')}
        >
          编辑
        </button>
        <button
          type="button"
          className={`md-tab ${activeTab === 'preview' ? 'active' : ''}`}
          onClick={() => setActiveTab('preview')}
        >
          预览
        </button>
      </div>
      {activeTab === 'editor' ? (
        <textarea
          className="md-input-area"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="欢迎使用markdown编辑器"
        />
      ) : (
        <div className="md-content" dangerouslySetInnerHTML={{ __html: rendered }} />
      )}
    </div>
  )
}
