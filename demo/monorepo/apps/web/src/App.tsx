import React, { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { Button, Card } from '@monorepo/ui'
import { formatDate, getRelativeTime, capitalize, debounce } from '@monorepo/utils'
import Home from './pages/Home'
import Demo from './pages/Demo'
import './App.css'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())

  const updateTime = debounce(() => {
    setCurrentTime(new Date())
  }, 1000)

  React.useEffect(() => {
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <nav className="app-nav">
            <Link to="/" className="nav-link">
              <Button variant="primary">首页</Button>
            </Link>
            <Link to="/demo" className="nav-link">
              <Button variant="secondary">组件演示</Button>
            </Link>
          </nav>
          <div className="app-time">
            <Card shadow={false} className="time-card">
              <div className="time-content">
                <div className="current-time">{formatDate(currentTime, 'YYYY-MM-DD HH:mm:ss')}</div>
                <div className="relative-time">{getRelativeTime(currentTime)}</div>
              </div>
            </Card>
          </div>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/demo" element={<Demo />} />
          </Routes>
        </main>

        <footer className="app-footer">
          <p>&copy; 2024 Monorepo Demo - {capitalize('built with pnpm workspace')}</p>
        </footer>
      </div>
    </Router>
  )
}

export default App