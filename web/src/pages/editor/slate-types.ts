import { BaseElement, BaseText } from 'slate'

export interface Paragraph extends BaseElement {
  type: 'paragraph'
}

export interface HeadingElement extends BaseElement {
  type: 'heading'
  level: 1 | 2 | 3 | 4 | 5 | 6
}

export interface ListElement extends BaseElement {
  type: 'order-list' | 'bullet-list'
  uuid: string
  indent: number
}

export interface QuoteElement extends BaseElement {
  type: 'quote'
}

export interface CodeElement extends BaseElement {
  type: 'code'
}

export interface TaskListElement extends BaseElement {
  type: 'task-list'
  uuid: string
  indent: number
  checked: boolean
}

export interface FormattedText extends BaseText {
  bold?: boolean
  italic?: boolean
  underline?: boolean
  code?: boolean
}

// 表格相关的接口
export interface BorderStyle {
  color?: string
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
}

export interface TableElement extends BaseElement {
  type: 'table'
  colSizes?: number[]
  marginLeft?: number
}

export interface TableRowElement extends BaseElement {
  type: 'table-row'
  size?: number
}

export interface TableCellElement extends BaseElement {
  type: 'table-cell'
  colSpan?: number
  rowSpan?: number
  background?: string
  borders?: {
    top?: BorderStyle
    right?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
  }
}

export type CustomElement =
  | Paragraph
  | HeadingElement
  | ListElement
  | QuoteElement
  | CodeElement
  | TaskListElement
  | TableElement
  | TableRowElement
  | TableCellElement

export type CustomText = FormattedText

declare module 'slate' {
  interface CustomTypes {
    Element: CustomElement
    Text: CustomText
  }
}
