import { useSlate } from 'slate-react'
import { Node } from 'slate'
import { useState, useMemo } from 'react'
import { Keyboard, HelpCircle, X } from 'lucide-react'
import './status-bar.css'

const shortcuts = [
  {
    category: 'Markdown 快捷输入',
    items: [
      { key: '# + 空格', desc: '标题 (H1-H6)' },
      { key: '> + 空格', desc: '引用块' },
      { key: '``` + 空格', desc: '代码块' },
      { key: '1. + 空格', desc: '有序列表' },
      { key: '- 或 * + 空格', desc: '无序列表' },
    ],
  },
  {
    category: '文本格式化',
    items: [
      { key: 'Ctrl + B', desc: '粗体' },
      { key: 'Ctrl + I', desc: '斜体' },
      { key: 'Ctrl + U', desc: '下划线' },
      { key: 'Ctrl + `', desc: '行内代码' },
    ],
  },
  {
    category: '列表操作',
    items: [
      { key: 'Tab', desc: '增加缩进' },
      { key: 'Shift + Tab', desc: '减少缩进' },
      { key: 'Enter', desc: '新列表项' },
      { key: 'Backspace (空行)', desc: '退出列表' },
    ],
  },
  {
    category: '编辑操作',
    items: [
      { key: 'Ctrl + Z', desc: '撤销' },
      { key: 'Ctrl + Y', desc: '重做' },
    ],
  },
]

function ShortcutsPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="shortcuts-panel">
      <div className="shortcuts-header">
        <Keyboard size={18} />
        <span>键盘快捷键</span>
        <button className="close-btn" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="shortcuts-content">
        {shortcuts.map((category, idx) => (
          <div key={idx} className="shortcut-category">
            <h4>{category.category}</h4>
            <div className="shortcut-list">
              {category.items.map((item, i) => (
                <div key={i} className="shortcut-item">
                  <kbd>{item.key}</kbd>
                  <span>{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function EditorStatusBar() {
  const editor = useSlate()
  const [showShortcuts, setShowShortcuts] = useState(false)

  // 计算字数统计
  const stats = useMemo(() => {
    const text = editor.children.map((n) => Node.string(n)).join('\n')

    const characters = text.length
    const charactersNoSpace = text.replace(/\s/g, '').length

    // 中文按字数，英文按词数
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length
    const englishWords = text
      .replace(/[\u4e00-\u9fa5]/g, ' ')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length > 0).length

    const words = chineseChars + englishWords

    return { characters, charactersNoSpace, words }
  }, [editor.children])

  return (
    <>
      {showShortcuts && <ShortcutsPanel onClose={() => setShowShortcuts(false)} />}

      <div className="editor-status-bar">
        <div className="status-left">
          <button className="status-btn" onClick={() => setShowShortcuts(!showShortcuts)} title="查看快捷键">
            <HelpCircle size={14} />
            <span>快捷键</span>
          </button>
        </div>

        <div className="status-right">
          <span className="stat-item" title="总字符数（含空格）">
            {stats.characters} 字符
          </span>
          <span className="stat-divider">|</span>
          <span className="stat-item" title="字数（中文按字，英文按词）">
            {stats.words} 字/词
          </span>
        </div>
      </div>
    </>
  )
}
