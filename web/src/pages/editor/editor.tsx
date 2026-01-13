import { useEffect, useMemo, useState } from 'react'
import { Editor as SlateEditor, Node } from 'slate'
import storage from '../../services/storage'
import './editor.css'
import type { Value } from 'platejs'
import { Plate, PlateContent, usePlateEditor } from 'platejs/react'
import {
  BlockquotePlugin,
  BoldPlugin,
  CodePlugin,
  H1Plugin,
  H2Plugin,
  H3Plugin,
  ItalicPlugin,
  StrikethroughPlugin,
  UnderlinePlugin
} from '@platejs/basic-nodes/react'
import { tryAutoformatOnSpace } from './autoformat'
import { handleTodoEnter, isBlockActive } from './commands'
import {
  BlockquoteElement,
  CodeBlockElement,
  H1Element,
  H2Element,
  H3Element,
  LinkElement,
  ListElement,
  ListItemElement,
  TodoItemElement,
  TodoListElement
} from './elements'
import {
  CodeBlockPlugin,
  LinkPlugin,
  ListItemPlugin,
  OlListPlugin,
  TodoItemPlugin,
  TodoListPlugin,
  UlListPlugin
} from './plugins'
import { EditorToolbar } from './toolbar'
import { NODE_CODE_BLOCK, STORAGE_DEBOUNCE_MS } from './constants'
import { parseStoredValue } from './value'

export default function Editor() {
  const initialValue = useMemo(() => parseStoredValue(storage.getMarkdownContent()), [])
  const [value, setValue] = useState<Value>(initialValue)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  const plugins = useMemo(
    () => [
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikethroughPlugin,
      CodePlugin,
      H1Plugin.withComponent(H1Element),
      H2Plugin.withComponent(H2Element),
      H3Plugin.withComponent(H3Element),
      BlockquotePlugin.withComponent(BlockquoteElement),
      CodeBlockPlugin.withComponent(CodeBlockElement),
      UlListPlugin.withComponent(ListElement),
      OlListPlugin.withComponent(ListElement),
      ListItemPlugin.withComponent(ListItemElement),
      TodoListPlugin.withComponent(TodoListElement),
      TodoItemPlugin.withComponent(TodoItemElement),
      LinkPlugin.withComponent(LinkElement)
    ],
    []
  )

  const editor = usePlateEditor({
    plugins,
    value: initialValue
  })

  useEffect(() => {
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      storage.setMarkdownContent(JSON.stringify(value))
      setSaveState('saved')
      setLastSavedAt(new Date())
    }, STORAGE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [value])

  const stats = useMemo(() => {
    const text = value.map((node) => Node.string(node)).join('\n')
    const trimmed = text.trim()
    const words = trimmed ? trimmed.split(/\s+/).length : 0
    const chars = text.replace(/\s/g, '').length
    return { words, chars }
  }, [value])

  const saveLabel = useMemo(() => {
    if (saveState === 'saving') {
      return '保存中...'
    }
    if (saveState === 'saved' && lastSavedAt) {
      const time = new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
      }).format(lastSavedAt)
      return `已保存 ${time}`
    }
    return '未保存'
  }, [saveState, lastSavedAt])

  return (
    <div className="md-container">
      <Plate
        editor={editor}
        onChange={({ value }) => {
          setValue(value)
        }}
      >
        <div className="md-editor-card">
          <div className="md-toolbar-row">
            <EditorToolbar editor={editor as any} />
            <div className="md-meta">
              <div className={`md-save md-save--${saveState}`}>{saveLabel}</div>
              <div className="md-stats">
                <span>字数 {stats.chars}</span>
                <span>词数 {stats.words}</span>
              </div>
            </div>
          </div>
          <div className="md-editor-shell">
            <PlateContent
              className="md-editor"
              placeholder="开始写作..."
              autoFocus
              onKeyDown={(event) => {
                if (event.key === 'Enter' && isBlockActive(editor as any, NODE_CODE_BLOCK)) {
                  event.preventDefault()
                  SlateEditor.insertText(editor as any, '\n')
                  return
                }
                if (event.key === 'Enter' && handleTodoEnter(editor as any)) {
                  event.preventDefault()
                  return
                }
                if (event.key === ' ' && tryAutoformatOnSpace(editor as any)) {
                  event.preventDefault()
                }
              }}
            />
          </div>
        </div>
      </Plate>
    </div>
  )
}
