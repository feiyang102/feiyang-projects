const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const app = express();
const PORT = process.env.PORT || 3000;

// 创建数据库连接
const db = new Database('./scorm.db', { verbose: console.log });

// 初始化数据库
function initDatabase() {
  // 创建courses表（如果不存在）
  db.exec(`
    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      duration TEXT
    );
  `);
  
  // 检查是否已有数据，如果没有则插入一些示例数据
  const stmt = db.prepare('SELECT COUNT(*) as count FROM courses');
  const result = stmt.get();
  
  if (result.count === 0) {
    const insert = db.prepare('INSERT INTO courses (title, description, duration) VALUES (@title, @description, @duration)');
    const examples = [
      { title: 'SCORM基础课程', description: 'SCORM标准的入门课程', duration: '2小时' },
      { title: '高级SCORM应用', description: '深入学习SCORM高级特性', duration: '3小时' }
    ];
    
    examples.forEach(course => insert.run(course));
    console.log('示例课程数据已插入');
  }
}

// 初始化数据库
initDatabase();

// 中间件
app.use(cors());
app.use(express.json());

// API接口示例
app.get('/', (req, res) => {
  res.send('SCORM后端服务正在运行');
});

// 获取所有课程
app.get('/api/courses', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM courses');
    const courses = stmt.all();
    res.json(courses);
  } catch (error) {
    console.error('获取课程失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取单个课程
app.get('/api/courses/:id', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const course = stmt.get(parseInt(req.params.id));
    
    if (!course) {
      return res.status(404).json({ message: '课程未找到' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('获取课程失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 添加新课程
app.post('/api/courses', (req, res) => {
  try {
    const { title, description, duration } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: '标题不能为空' });
    }
    
    const stmt = db.prepare('INSERT INTO courses (title, description, duration) VALUES (@title, @description, @duration)');
    const result = stmt.run({ title, description, duration });
    
    const newCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('添加课程失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新课程
app.put('/api/courses/:id', (req, res) => {
  try {
    const { title, description, duration } = req.body;
    const id = parseInt(req.params.id);
    
    // 检查课程是否存在
    const check = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!check) {
      return res.status(404).json({ message: '课程未找到' });
    }
    
    const stmt = db.prepare('UPDATE courses SET title = @title, description = @description, duration = @duration WHERE id = @id');
    stmt.run({ id, title, description, duration });
    
    const updatedCourse = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    res.json(updatedCourse);
  } catch (error) {
    console.error('更新课程失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查课程是否存在
    const check = db.prepare('SELECT * FROM courses WHERE id = ?').get(id);
    if (!check) {
      return res.status(404).json({ message: '课程未找到' });
    }
    
    const stmt = db.prepare('DELETE FROM courses WHERE id = ?');
    stmt.run(id);
    
    res.json({ message: '课程已成功删除' });
  } catch (error) {
    console.error('删除课程失败:', error);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});