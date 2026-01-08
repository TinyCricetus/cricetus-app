import { useEffect, useState } from 'react'
import { IpcRendererService } from '../../services/ipc-renderer'
import Toast, { ToastMessage } from '../../components/Toast'
import './MusicHistory.css'

interface SongData {
  name: string
  info: string
  id: string
}

type ButtonType = 'info' | 'primary' | 'warning' | 'error'

export default function MusicHistory() {
  const [songHistory, setSongHistory] = useState<SongData[]>([])
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    let alive = true
    async function initCloudMusicHistory() {
      const history = await IpcRendererService.Ins.invokeToGetCloudMusicHistory()
      const songList = history.map((songItem) => {
        const name = songItem.track.name || 'unknown'
        const artists = songItem.track.artists?.map((item) => item.name) || []
        const date = new Date(songItem.time).toLocaleDateString()
        return {
          name,
          info: `艺术家：${artists.join(' & ')}   上次欣赏：${date}`,
          id: songItem.id
        }
      })
      if (alive) {
        setSongHistory(songList)
      }
    }

    initCloudMusicHistory()
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }
    const timer = window.setTimeout(() => setToast(null), 3000)
    return () => window.clearTimeout(timer)
  }, [toast])

  function getButtonType(seed: number): ButtonType {
    const seedNum = Math.floor(seed * 1000) % 4
    const typeMap: Record<string, ButtonType> = {
      '0': 'info',
      '1': 'primary',
      '2': 'warning',
      '3': 'error'
    }
    return typeMap[seedNum + '']
  }

  function clickSongName(name: string) {
    window.navigator.clipboard.writeText(name)
    setToast({ type: 'success', text: '歌曲复制成功！' })
  }

  return (
    <div className="song-container">
      <Toast message={toast} />
      <ul className="song-list">
        {songHistory.map((song) => (
          <li key={song.id}>
            <button
              type="button"
              className={`song-button ${getButtonType(Math.random())}`}
              title={song.info}
              onClick={() => clickSongName(song.name)}
            >
              {song.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
