import { createPlatePlugin } from 'platejs/react'
import {
  NODE_CODE_BLOCK,
  NODE_LI,
  NODE_LINK,
  NODE_OL,
  NODE_TODO_ITEM,
  NODE_TODO_LIST,
  NODE_UL
} from './constants'

export const CodeBlockPlugin = createPlatePlugin({
  key: NODE_CODE_BLOCK,
  node: {
    isElement: true
  }
})

export const LinkPlugin = createPlatePlugin({
  key: NODE_LINK,
  node: {
    isElement: true,
    isVoid: false
  }
})

export const UlListPlugin = createPlatePlugin({
  key: NODE_UL,
  node: {
    isElement: true
  }
})

export const OlListPlugin = createPlatePlugin({
  key: NODE_OL,
  node: {
    isElement: true
  }
})

export const ListItemPlugin = createPlatePlugin({
  key: NODE_LI,
  node: {
    isElement: true
  }
})

export const TodoListPlugin = createPlatePlugin({
  key: NODE_TODO_LIST,
  node: {
    isElement: true
  }
})

export const TodoItemPlugin = createPlatePlugin({
  key: NODE_TODO_ITEM,
  node: {
    isElement: true
  }
})
