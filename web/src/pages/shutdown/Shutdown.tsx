import { useEffect, useState } from 'react'
import { IpcRendererService } from '../../services/ipc-renderer'
import Toast, { ToastMessage } from '../../components/Toast'
import './Shutdown.css'

export default function Shutdown() {
  const [timeValue, setTimeValue] = useState('')
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  function getDelaySeconds(value: string) {
    if (!value) {
      return null
    }
    const [hours, minutes, seconds] = value.split(':').map((part) => Number(part))
    const now = new Date()
    const target = new Date()
    target.setHours(hours || 0, minutes || 0, seconds || 0, 0)
    let diffSeconds = Math.floor((target.getTime() - now.getTime()) / 1000)
    if (diffSeconds < 0) {
      diffSeconds = 24 * 60 * 60 + diffSeconds
    }
    return diffSeconds
  }

  function activeShutdown() {
    const delaySeconds = getDelaySeconds(timeValue)
    if (delaySeconds === null) {
      setToast({ type: 'info', text: '请选择时间以部署关机任务' })
      return
    }
    IpcRendererService.Ins.sendShutdownMsg(delaySeconds)
    setToast({ type: 'success', text: '关机任务已被部署，请留意系统通知栏' })
  }

  function cancelShutdown() {
    IpcRendererService.Ins.sendShutdownMsg(-1)
    setToast({ type: 'warning', text: '关机任务已被取消' })
  }

  return (
    <div className="shutdown-container">
      <Toast message={toast} />
      <div className="time-picker">
        <input
          className="time-input"
          type="time"
          step={1}
          value={timeValue}
          onChange={(event) => setTimeValue(event.target.value)}
          placeholder="请选择关机时间（时分秒）"
        />
      </div>
      <div className="button-list">
        <button type="button" className="action-button success" onClick={activeShutdown}>
          发起关机任务
        </button>
        <button type="button" className="action-button warning" onClick={cancelShutdown}>
          取消自动关机
        </button>
      </div>
    </div>
  )
}
