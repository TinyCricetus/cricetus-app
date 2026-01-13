import { useNavigate } from 'react-router-dom'
import './home.css'

const menuItems = [
  { id: 1, content: '自动关机部署', path: '/shutdown' },
  { id: 2, content: '网易云听歌记录', path: '/history' },
  { id: 3, content: '编辑器', path: '/editor' },
  { id: 4, content: '更多功能，敬请期待...' }
]

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="home-container">
      <ul className="grid-menu">
        {menuItems.map((item) => (
          <li key={item.id} onClick={() => item.path && navigate(item.path)}>
            <span className="grid-content">{item.content}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
