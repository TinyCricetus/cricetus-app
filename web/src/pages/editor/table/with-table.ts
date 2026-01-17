import { Editor, Transforms, Element, Node } from 'slate'

export const withTable = <T extends Editor>(editor: T) => {
  const { normalizeNode } = editor

  editor.normalizeNode = (entry) => {
    const [node, path] = entry

    // 1. 如果表格是文档的最后一个节点，在后面插入一个空段落
    if (Editor.isEditor(node)) {
      const lastNode = node.children[node.children.length - 1]

      if (Element.isElement(lastNode) && lastNode.type === 'table') {
        const paragraph = { type: 'paragraph', children: [{ text: '' }] }
        Transforms.insertNodes(editor, paragraph as any, { at: [node.children.length] })
        return
      }
    }

    // 2. 确保表格行里只有单元格
    if (Element.isElement(node) && node.type === 'table-row') {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child) && child.type !== 'table-cell') {
          Transforms.removeNodes(editor, { at: childPath })
          return
        }
      }
    }

    // 3. 确保表格里只有行
    if (Element.isElement(node) && node.type === 'table') {
      for (const [child, childPath] of Node.children(editor, path)) {
        if (Element.isElement(child) && child.type !== 'table-row') {
          Transforms.removeNodes(editor, { at: childPath })
          return
        }
      }
    }

    // 如果没有特殊处理，回退到默认的 normalizeNode
    normalizeNode(entry)
  }

  return editor
}
