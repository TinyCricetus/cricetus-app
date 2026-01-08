import { Routes, Route } from 'react-router-dom'
import Header from './components/header'
import Home from './pages/home/home'
import Shutdown from './pages/shutdown/shutdown'
import MusicHistory from './pages/music-history/music-history'
import Markdown from './pages/markdown/markdown'

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
