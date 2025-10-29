import React, { useState } from 'react'
import { Button, Input, Card } from '@monorepo/ui'
import { formatDate, getRelativeTime, capitalize, debounce, isValidEmail } from '@monorepo/utils'

const Demo: React.FC = () => {
  const [inputValue, setInputValue] = useState('')
  const [email, setEmail] = useState('')
  const [isEmailValid, setIsEmailValid] = useState(true)
  const [buttonClicks, setButtonClicks] = useState(0)

  const handleEmailChange = (value: string) => {
    setEmail(value)
    setIsEmailValid(isValidEmail(value) || value === '')
  }

  const handleButtonClick = debounce(() => {
    setButtonClicks(prev => prev + 1)
  }, 300)

  const currentTime = new Date()
  const oneHourAgo = new Date(currentTime.getTime() - 60 * 60 * 1000)

  return (
    <div className="demo">
      <h1 className="demo-title">组件演示页面</h1>
      
      <div className="demo-grid">
        {/* Button 组件演示 */}
        <Card title="Button 组件" className="demo-card">
          <div className="button-demo">
            <div className="button-group">
              <Button variant="primary">主要按钮</Button>
              <Button variant="secondary">次要按钮</Button>
              <Button variant="danger">危险按钮</Button>
            </div>
            <div className="button-group">
              <Button size="small">小按钮</Button>
              <Button size="medium">中按钮</Button>
              <Button size="large">大按钮</Button>
            </div>
            <div className="button-group">
              <Button disabled>禁用按钮</Button>
              <Button onClick={handleButtonClick}>
                防抖按钮 (点击次数: {buttonClicks})
              </Button>
            </div>
          </div>
        </Card>

        {/* Input 组件演示 */}
        <Card title="Input 组件" className="demo-card">
          <div className="input-demo">
            <Input
              placeholder="请输入文本..."
              value={inputValue}
              onChange={setInputValue}
              label="普通输入框"
            />
            <Input
              type="email"
              placeholder="请输入邮箱地址"
              value={email}
              onChange={handleEmailChange}
              label="邮箱输入框"
              error={!isEmailValid && email ? '请输入有效的邮箱地址' : undefined}
            />
            <Input
              type="password"
              placeholder="请输入密码"
              label="密码输入框"
            />
            <Input
              disabled
              placeholder="禁用输入框"
              label="禁用状态"
            />
          </div>
        </Card>

        {/* 工具函数演示 */}
        <Card title="工具函数演示" className="demo-card">
          <div className="utils-demo">
            <div className="utils-item">
              <strong>日期格式化:</strong> {formatDate(currentTime, 'YYYY-MM-DD HH:mm:ss')}
            </div>
            <div className="utils-item">
              <strong>相对时间:</strong> {getRelativeTime(oneHourAgo)}
            </div>
            <div className="utils-item">
              <strong>首字母大写:</strong> {capitalize('hello world')}
            </div>
            <div className="utils-item">
              <strong>输入内容:</strong> {inputValue || '(空)'}
            </div>
          </div>
        </Card>

        {/* Card 组件演示 */}
        <Card title="Card 组件变体" className="demo-card">
          <div className="card-variants">
            <Card title="默认卡片" className="variant-card">
              <p>这是默认的卡片样式</p>
              <Button size="small">卡片内按钮</Button>
            </Card>
            
            <Card title="无阴影卡片" shadow={false} className="variant-card">
              <p>没有阴影效果的卡片</p>
            </Card>
            
            <Card 
              title="带页脚的卡片" 
              footer={
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Button size="small" variant="secondary">取消</Button>
                  <Button size="small">确认</Button>
                </div>
              }
              className="variant-card"
            >
              <p>包含页脚内容的卡片</p>
            </Card>
          </div>
        </Card>
      </div>

      {/* 集成演示 */}
      <Card title="集成演示" className="integration-demo">
        <div className="integration-content">
          <h3>Monorepo 包集成</h3>
          <p>这个页面展示了如何在前端应用中集成使用 monorepo 中的各个包：</p>
          
          <ul>
            <li>✅ 从 <code>@monorepo/ui</code> 导入 UI 组件</li>
            <li>✅ 从 <code>@monorepo/utils</code> 导入工具函数</li>
            <li>✅ 使用 TypeScript 路径别名</li>
            <li>✅ 实现组件间的数据传递和状态管理</li>
            <li>✅ 演示防抖、验证等高级功能</li>
          </ul>
          
          <div className="integration-example">
            <Input
              value={inputValue}
              onChange={setInputValue}
              placeholder="试试输入一些内容..."
              label="实时输入演示"
            />
            <div className="input-preview">
              <strong>实时预览:</strong> {inputValue ? capitalize(inputValue) : '(等待输入...)'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Demo