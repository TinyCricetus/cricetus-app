export const STORAGE_DEBOUNCE_MS = 1200

export const NODE_PARAGRAPH = 'p'
export const NODE_BLOCKQUOTE = 'blockquote'
export const NODE_H1 = 'h1'
export const NODE_H2 = 'h2'
export const NODE_H3 = 'h3'
export const NODE_CODE_BLOCK = 'code_block'
export const NODE_LINK = 'a'

export const NODE_UL = 'ul'
export const NODE_OL = 'ol'
export const NODE_LI = 'li'

export const NODE_TODO_LIST = 'todo_list'
export const NODE_TODO_ITEM = 'todo_item'

export const SUPPORTED_BLOCKS = new Set([
  NODE_PARAGRAPH,
  NODE_BLOCKQUOTE,
  NODE_H1,
  NODE_H2,
  NODE_H3,
  NODE_CODE_BLOCK,
  NODE_LINK,
  NODE_UL,
  NODE_OL,
  NODE_LI,
  NODE_TODO_LIST,
  NODE_TODO_ITEM
])

