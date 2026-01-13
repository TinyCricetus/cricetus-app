import { PlateElement, type PlateElementProps } from 'platejs/react'
import { Transforms } from 'slate'
import { ReactEditor } from 'slate-react'

export const H1Element = (props: PlateElementProps) => <PlateElement as="h1" {...props} />
export const H2Element = (props: PlateElementProps) => <PlateElement as="h2" {...props} />
export const H3Element = (props: PlateElementProps) => <PlateElement as="h3" {...props} />
export const BlockquoteElement = (props: PlateElementProps) => <PlateElement as="blockquote" {...props} />

export const CodeBlockElement = ({ attributes, children }: PlateElementProps) => (
  <pre {...attributes}>
    <code>{children}</code>
  </pre>
)

export const LinkElement = ({ attributes, children, element }: PlateElementProps) => {
  const url = (element as any)?.url || '#'
  return (
    <a href={url} {...attributes}>
      {children}
    </a>
  )
}

export const ListElement = ({ attributes, children, element }: PlateElementProps) => {
  const Tag = element?.type === 'ol' ? 'ol' : 'ul'
  return <Tag {...attributes}>{children}</Tag>
}

export const ListItemElement = ({ attributes, children }: PlateElementProps) => <li {...attributes}>{children}</li>

export const TodoListElement = ({ attributes, children }: PlateElementProps) => (
  <div {...attributes} className="md-todo-list">
    {children}
  </div>
)

export const TodoItemElement = ({ attributes, children, element, editor }: PlateElementProps) => {
  const safeEditor = editor as any
  const checked = Boolean((element as any)?.checked)
  const path = safeEditor ? ReactEditor.findPath(safeEditor, element as any) : null
  const className = `md-todo-item${checked ? ' is-checked' : ''}${(attributes as any)?.className ? ` ${(attributes as any).className}` : ''}`

  const toggleChecked = () => {
    if (!safeEditor || !path) return
    Transforms.setNodes(safeEditor, { checked: !checked } as any, { at: path })
  }

  return (
    <div {...attributes} className={className}>
      <span className="md-todo-toggle" contentEditable={false}>
        <input
          type="checkbox"
          checked={checked}
          readOnly
          onMouseDown={(event) => {
            if (!safeEditor || !path) return
            event.preventDefault()
            toggleChecked()
          }}
        />
      </span>
      <div className="md-todo-content">{children}</div>
    </div>
  )
}
