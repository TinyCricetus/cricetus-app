import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { IpcRendererService } from '../services/ipc-renderer'
import './header.css'

export default function Header() {
  const navigate = useNavigate()
  const [systemColor, setSystemColor] = useState('rgb(167, 167, 167)')

  useEffect(() => {
    let alive = true
    IpcRendererService.Ins.invokeToGetSystemColor().then((color) => {
      if (alive) {
        setSystemColor(color)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  return (
    <div className="ui-header" style={{ backgroundColor: systemColor }}>
      <button className="close-button" type="button" onClick={() => IpcRendererService.Ins.sendCloseMsg()} aria-label="close" />
      <button className="home-button" type="button" onClick={() => navigate('/')} aria-label="home" />
    </div>
  )
}
