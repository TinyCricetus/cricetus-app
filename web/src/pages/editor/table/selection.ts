import { Editor, Path } from 'slate'
import { ReactEditor } from 'slate-react'

/**
 * 表格选区管理器
 * 用于跟踪和管理表格单元格的选区状态
 */
export class TableSelectionManager {
  private selectedCells: Set<string> = new Set()
  private isSelecting = false
  private startCell: Path | null = null
  private endCell: Path | null = null
  private editor: Editor | null = null

  public get isSelectingMode() {
    return this.isSelecting
  }

  public setStartCell(path: Path) {
    this.startCell = path
  }

  public getStartCell() {
    return this.startCell
  }

  /**
   * 开始框选
   */
  startSelection(editor: Editor, cellPath: Path) {
    this.editor = editor
    this.isSelecting = true
    this.startCell = cellPath
    this.endCell = cellPath
    this.selectedCells.clear()
    this.selectedCells.add(this.pathToKey(cellPath))
    this.updateSelection()
  }

  /**
   * 更新框选范围
   */
  updateSelection(cellPath?: Path) {
    if (!this.isSelecting || !this.startCell || !this.editor) return

    if (cellPath) {
      this.endCell = cellPath
    }

    if (!this.endCell) return

    // 计算选区范围
    const range = this.calculateRange(this.startCell, this.endCell)
    if (!range) return

    // 更新选中的单元格集合
    this.selectedCells.clear()
    const cells = this.getCellsInRange(range)
    cells.forEach((path) => {
      this.selectedCells.add(this.pathToKey(path))
    })

    this.updateCellStyles()
  }

  /**
   * 结束框选
   */
  endSelection() {
    this.isSelecting = false
  }

  /**
   * 清除选区
   */
  clearSelection() {
    this.selectedCells.clear()
    this.startCell = null
    this.endCell = null
    this.isSelecting = false
    this.updateCellStyles()
  }

  /**
   * 获取选中的单元格路径列表
   */
  getSelectedCells(): Path[] {
    return Array.from(this.selectedCells).map((key) => this.keyToPath(key))
  }

  /**
   * 检查是否有选中的单元格
   */
  hasSelection(): boolean {
    return this.selectedCells.size > 1
  }

  /**
   * 获取选区信息（行列范围）
   */
  getSelectionRange(): { minRow: number; maxRow: number; minCol: number; maxCol: number } | null {
    if (!this.startCell || !this.endCell) return null
    return this.calculateRange(this.startCell, this.endCell)
  }

  /**
   * 计算两个单元格之间的范围
   */
  private calculateRange(
    start: Path,
    end: Path,
  ): {
    minRow: number
    maxRow: number
    minCol: number
    maxCol: number
  } | null {
    const startRow = start[start.length - 2]
    const startCol = start[start.length - 1]
    const endRow = end[end.length - 2]
    const endCol = end[end.length - 1]

    return {
      minRow: Math.min(startRow, endRow),
      maxRow: Math.max(startRow, endRow),
      minCol: Math.min(startCol, endCol),
      maxCol: Math.max(startCol, endCol),
    }
  }

  /**
   * 获取范围内的所有单元格路径
   */
  private getCellsInRange(range: { minRow: number; maxRow: number; minCol: number; maxCol: number }): Path[] {
    if (!this.startCell) return []

    const tablePath = this.startCell.slice(0, -2)
    const cells: Path[] = []

    for (let row = range.minRow; row <= range.maxRow; row++) {
      for (let col = range.minCol; col <= range.maxCol; col++) {
        cells.push([...tablePath, row, col])
      }
    }

    return cells
  }

  /**
   * 更新单元格样式
   */
  private updateCellStyles() {
    if (!this.editor) return

    // 移除所有单元格的选中样式
    const allCells = document.querySelectorAll('.slate-table-cell')
    allCells.forEach((cell) => {
      cell.classList.remove('cell-selected')
    })

    // 添加选中样式到选中的单元格
    this.selectedCells.forEach((key) => {
      const path = this.keyToPath(key)
      try {
        const element = ReactEditor.toDOMNode(this.editor as ReactEditor, Editor.node(this.editor!, path)[0])
        if (element) {
          element.classList.add('cell-selected')
        }
      } catch (e) {
        // 忽略错误
      }
    })
  }

  /**
   * Path 转换为字符串 key
   */
  private pathToKey(path: Path): string {
    return path.join(',')
  }

  /**
   * 字符串 key 转换为 Path
   */
  private keyToPath(key: string): Path {
    return key.split(',').map(Number)
  }
}

// 全局单例
let globalSelectionManager: TableSelectionManager | null = null

export function getTableSelectionManager(): TableSelectionManager {
  if (!globalSelectionManager) {
    globalSelectionManager = new TableSelectionManager()
  }
  return globalSelectionManager
}
