import { useEffect, useState, useCallback, useMemo } from 'react'
import { Editor, Transforms } from 'slate'
import {
  Heading1, Heading2, Heading3, Heading4, Heading5, Heading6,
  List, ListOrdered, CheckSquare, Quote, Code, Table,
  Minus
} from 'lucide-react'
import './slash-menu.css'

// 命令类型定义
interface SlashCommand {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  keywords: string[]
  onSelect: (editor: Editor) => void
}

// UUID 生成函数
function generateUuid() {
  return Math.random().toString(36).substring(2, 15)
}

// 所有可用命令
const createCommands = (): SlashCommand[] => [
  {
    id: 'heading1',
    title: '一级标题',
    description: '最大的标题',
    icon: <Heading1 size={18} />,
    keywords: ['h1', 'heading1', '标题', '一级'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'heading', level: 1 } as any)
    }
  },
  {
    id: 'heading2',
    title: '二级标题',
    description: '大标题',
    icon: <Heading2 size={18} />,
    keywords: ['h2', 'heading2', '标题', '二级'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'heading', level: 2 } as any)
    }
  },
  {
    id: 'heading3',
    title: '三级标题',
    description: '中等标题',
    icon: <Heading3 size={18} />,
    keywords: ['h3', 'heading3', '标题', '三级'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'heading', level: 3 } as any)
    }
  },
  {
    id: 'heading4',
    title: '四级标题',
    description: '小标题',
    icon: <Heading4 size={18} />,
    keywords: ['h4', 'heading4', '标题', '四级'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'heading', level: 4 } as any)
    }
  },
  {
    id: 'heading5',
    title: '五级标题',
    description: '更小的标题',
    icon: <Heading5 size={18} />,
    keywords: ['h5', 'heading5', '标题', '五级'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'heading', level: 5 } as any)
    }
  },
  {
    id: 'heading6',
    title: '六级标题',
    description: '最小的标题',
    icon: <Heading6 size={18} />,
    keywords: ['h6', 'heading6', '标题', '六级'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'heading', level: 6 } as any)
    }
  },
  {
    id: 'bullet-list',
    title: '无序列表',
    description: '带圆点的列表',
    icon: <List size={18} />,
    keywords: ['ul', 'bullet', 'list', '列表', '无序'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, {
        type: 'bullet-list',
        indent: 0,
        uuid: generateUuid()
      } as any)
    }
  },
  {
    id: 'order-list',
    title: '有序列表',
    description: '带数字的列表',
    icon: <ListOrdered size={18} />,
    keywords: ['ol', 'ordered', 'list', '列表', '有序', '数字'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, {
        type: 'order-list',
        indent: 0,
        uuid: generateUuid()
      } as any)
    }
  },
  {
    id: 'task-list',
    title: '任务列表',
    description: '可勾选的待办事项',
    icon: <CheckSquare size={18} />,
    keywords: ['todo', 'task', 'checkbox', '任务', '待办', '清单'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, {
        type: 'task-list',
        indent: 0,
        uuid: generateUuid(),
        checked: false
      } as any)
    }
  },
  {
    id: 'quote',
    title: '引用',
    description: '引用文本',
    icon: <Quote size={18} />,
    keywords: ['quote', 'blockquote', '引用'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'quote' } as any)
    }
  },
  {
    id: 'code',
    title: '代码块',
    description: '显示代码',
    icon: <Code size={18} />,
    keywords: ['code', 'pre', '代码'],
    onSelect: (editor) => {
      Transforms.setNodes(editor, { type: 'code' } as any)
    }
  },
  {
    id: 'table',
    title: '表格',
    description: '插入表格',
    icon: <Table size={18} />,
    keywords: ['table', '表格'],
    onSelect: (editor) => {
      // 创建一个 3x3 的表格
      const tableNode = {
        type: 'table',
        colSizes: [200, 200, 200],
        children: Array.from({ length: 3 }, () => ({
          type: 'table-row',
          children: Array.from({ length: 3 }, () => ({
            type: 'table-cell',
            children: [{ text: '' }]
          }))
        }))
      }

      Transforms.insertNodes(editor, tableNode as any)
    }
  },
  {
    id: 'divider',
    title: '分隔线',
    description: '水平分隔线',
    icon: <Minus size={18} />,
    keywords: ['hr', 'divider', 'separator', '分隔线'],
    onSelect: (editor) => {
      // 暂时用段落代替
      Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [{ text: '---' }]
      } as any)
    }
  }
]

interface SlashMenuProps {
  // 父组件传入的 editor 实例
  editor: Editor
  // 父组件传入的搜索文本
  searchText?: string
  // 选中命令时的回调
  onSelectCommand?: () => void
}

export function SlashMenu({ editor, searchText = '', onSelectCommand }: SlashMenuProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const commands = useMemo(() => createCommands(), [])

  // 根据搜索文本过滤命令
  const filteredCommands = useMemo(() => {
    if (!searchText) return commands

    const lowerSearch = searchText.toLowerCase()
    return commands.filter(cmd =>
      cmd.title.toLowerCase().includes(lowerSearch) ||
      cmd.description.toLowerCase().includes(lowerSearch) ||
      cmd.keywords.some(kw => kw.toLowerCase().includes(lowerSearch))
    )
  }, [commands, searchText])

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [searchText])

  // 处理命令选择
  const handleSelect = useCallback((index: number) => {
    const command = filteredCommands[index]
    if (command) {
      command.onSelect(editor)
      onSelectCommand?.()
    }
  }, [editor, filteredCommands, onSelectCommand])

  // 键盘导航
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex(prev => (prev + 1) % filteredCommands.length)
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        handleSelect(selectedIndex)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [filteredCommands.length, handleSelect, selectedIndex])

  if (filteredCommands.length === 0) {
    return (
      <div className="slash-menu">
        <div className="slash-menu-empty">未找到匹配的命令</div>
      </div>
    )
  }

  return (
    <div className="slash-menu">
      {filteredCommands.map((cmd, index) => (
        <div
          key={cmd.id}
          className={`slash-menu-item ${index === selectedIndex ? 'selected' : ''}`}
          onClick={() => handleSelect(index)}
          onMouseEnter={() => setSelectedIndex(index)}
        >
          <div className="slash-menu-item-icon">{cmd.icon}</div>
          <div className="slash-menu-item-content">
            <div className="slash-menu-item-title">{cmd.title}</div>
            <div className="slash-menu-item-description">{cmd.description}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
