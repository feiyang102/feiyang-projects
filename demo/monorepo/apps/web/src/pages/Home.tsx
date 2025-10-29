import React from 'react'
import { Card, Button } from '@monorepo/ui'
import { formatDate, capitalize, generateRandomString } from '@monorepo/utils'

const Home: React.FC = () => {
  const [randomString, setRandomString] = React.useState('')

  const generateNewString = () => {
    setRandomString(generateRandomString(12))
  }

  React.useEffect(() => {
    generateNewString()
  }, [])

  return (
    <div className="home">
      <div className="hero-section">
        <Card className="hero-card">
          <h1 className="hero-title">
            {capitalize('welcome to monorepo demo')}
          </h1>
          <p className="hero-subtitle">
            这是一个基于 PNPM Workspace 的 Monorepo 示例项目
          </p>
          <div className="hero-actions">
            <Button variant="primary" size="large" onClick={generateNewString}>
              生成随机字符串
            </Button>
          </div>
          {randomString && (
            <div className="random-string">
              <code>{randomString}</code>
            </div>
          )}
        </Card>
      </div>

      <div className="features-section">
        <h2 className="section-title">项目特性</h2>
        <div className="features-grid">
          <Card title="共享工具库" className="feature-card">
            <p>包含日期处理、字符串操作、数字格式化等通用工具函数</p>
            <div className="feature-example">
              <small>当前时间: {formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')}</small>
            </div>
          </Card>

          <Card title="UI组件库" className="feature-card">
            <p>可复用的React组件库，包含Button、Input、Card等基础组件</p>
            <div className="feature-example">
              <Button size="small">示例按钮</Button>
            </div>
          </Card>

          <Card title="前端应用" className="feature-card">
            <p>基于Vite + React的现代化前端应用，支持热重载和TypeScript</p>
            <div className="feature-example">
              <small>使用路径别名导入包</small>
            </div>
          </Card>

          <Card title="Monorepo架构" className="feature-card">
            <p>使用PNPM Workspace管理多个包，实现代码共享和依赖管理</p>
            <div className="feature-example">
              <small>workspace:* 依赖引用</small>
            </div>
          </Card>
        </div>
      </div>

      <div className="tech-stack-section">
        <Card title="技术栈" className="tech-stack-card">
          <div className="tech-list">
            <div className="tech-item">
              <strong>包管理:</strong> PNPM + Workspace
            </div>
            <div className="tech-item">
              <strong>前端框架:</strong> React 18 + TypeScript
            </div>
            <div className="tech-item">
              <strong>构建工具:</strong> Vite + Rollup
            </div>
            <div className="tech-item">
              <strong>样式方案:</strong> CSS Modules + CSS-in-JS
            </div>
            <div className="tech-item">
              <strong>测试框架:</strong> Jest + Testing Library
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Home