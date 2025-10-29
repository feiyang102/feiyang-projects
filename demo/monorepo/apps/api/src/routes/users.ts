import express from 'express'
import { formatDate, isValidEmail, generateRandomString } from '@monorepo/utils'

const router: express.Router = express.Router()

// 模拟用户数据
let users = [
  {
    id: 1,
    name: '张三',
    email: 'zhangsan@example.com',
    createdAt: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    name: '李四',
    email: 'lisi@example.com',
    createdAt: '2024-01-02 14:30:00'
  },
  {
    id: 3,
    name: '王五',
    email: 'wangwu@example.com',
    createdAt: '2024-01-03 09:15:00'
  }
]

// 获取所有用户
router.get('/', (req, res) => {
  const { page = 1, limit = 10 } = req.query
  const pageNum = parseInt(page as string)
  const limitNum = parseInt(limit as string)
  
  const startIndex = (pageNum - 1) * limitNum
  const endIndex = pageNum * limitNum
  
  const paginatedUsers = users.slice(startIndex, endIndex)
  
  res.json({
    data: paginatedUsers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: users.length,
      totalPages: Math.ceil(users.length / limitNum)
    },
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 根据ID获取用户
router.get('/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const user = users.find(u => u.id === userId)
  
  if (!user) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${userId} does not exist`,
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  res.json({
    data: user,
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 创建新用户
router.post('/', (req, res) => {
  const { name, email } = req.body
  
  // 验证必填字段
  if (!name || !email) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Name and email are required',
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  // 验证邮箱格式
  if (!isValidEmail(email)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid email format',
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  // 检查邮箱是否已存在
  const existingUser = users.find(u => u.email === email)
  if (existingUser) {
    return res.status(409).json({
      error: 'Conflict',
      message: 'Email already exists',
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  // 创建新用户
  const newUser = {
    id: users.length + 1,
    name,
    email,
    createdAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  }
  
  users.push(newUser)
  
  res.status(201).json({
    data: newUser,
    message: 'User created successfully',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 更新用户
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const { name, email } = req.body
  
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${userId} does not exist`,
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  // 验证邮箱格式
  if (email && !isValidEmail(email)) {
    return res.status(400).json({
      error: 'Validation failed',
      message: 'Invalid email format',
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  // 检查邮箱是否被其他用户使用
  if (email) {
    const emailExists = users.some(u => u.email === email && u.id !== userId)
    if (emailExists) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email already exists',
        timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
      })
    }
  }
  
  // 更新用户信息
  const updatedUser = {
    ...users[userIndex],
    ...(name && { name }),
    ...(email && { email }),
    updatedAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  }
  
  users[userIndex] = updatedUser
  
  res.json({
    data: updatedUser,
    message: 'User updated successfully',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 删除用户
router.delete('/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const userIndex = users.findIndex(u => u.id === userId)
  
  if (userIndex === -1) {
    return res.status(404).json({
      error: 'User not found',
      message: `User with ID ${userId} does not exist`,
      timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
    })
  }
  
  const deletedUser = users.splice(userIndex, 1)[0]
  
  res.json({
    data: deletedUser,
    message: 'User deleted successfully',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

// 生成随机用户
router.post('/random', (req, res) => {
  const randomName = `用户_${generateRandomString(6)}`
  const randomEmail = `${generateRandomString(8)}@example.com`
  
  const newUser = {
    id: users.length + 1,
    name: randomName,
    email: randomEmail,
    createdAt: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  }
  
  users.push(newUser)
  
  res.status(201).json({
    data: newUser,
    message: 'Random user created successfully',
    timestamp: formatDate(new Date(), 'YYYY-MM-DD HH:mm:ss')
  })
})

export default router