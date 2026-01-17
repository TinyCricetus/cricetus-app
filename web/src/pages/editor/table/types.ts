import { BaseElement } from 'slate'

// 边框样式
export interface BorderStyle {
  color?: string
  size?: number
  style?: 'solid' | 'dashed' | 'dotted'
}

// 表格元素
export interface TableElement extends BaseElement {
  type: 'table'
  colSizes?: number[] // 列宽数组
  rowHeights?: number[] // 行高数组
  marginLeft?: number // 左边距
  maxHeight?: number // 表格最大高度（用于滚动）
  stickyHeader?: boolean // 是否固定表头
}

// 表格行元素
export interface TableRowElement extends BaseElement {
  type: 'table-row'
  size?: number // 行高（兼容旧属性）
  height?: number // 行高
}

// 表格单元格元素
export interface TableCellElement extends BaseElement {
  type: 'table-cell'
  colSpan?: number // 列合并数
  rowSpan?: number // 行合并数
  align?: 'left' | 'center' | 'right' // 文本对齐
  background?: string // 背景色
  borders?: {
    top?: BorderStyle
    right?: BorderStyle
    bottom?: BorderStyle
    left?: BorderStyle
  }
}

// 表格插入选项
export interface InsertTableOptions {
  rowCount?: number // 行数，默认3
  colCount?: number // 列数，默认3
  colWidth?: number // 默认列宽，默认150
  rowHeight?: number // 默认行高，默认40
}

// 单元格位置
export interface CellPosition {
  row: number
  col: number
}

// 表格网格（用于合并操作）
export interface TableGrid {
  cells: (TableCellElement | null)[][]
  rowCount: number
  colCount: number
}
