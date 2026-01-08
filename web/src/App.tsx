import { Routes, Route } from 'react-router-dom'
import Header from './components/Header'
import Home from './pages/home/Home'
import Shutdown from './pages/shutdown/Shutdown'
import MusicHistory from './pages/music-history/MusicHistory'
import Markdown from './pages/markdown/Markdown'

export default function App() {
  return (
    <div className="main-container">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/shutdown" element={<Shutdown />} />
        <Route path="/history" element={<MusicHistory />} />
        <Route path="/markdown" element={<Markdown />} />
      </Routes>
    </div>
  )
}
