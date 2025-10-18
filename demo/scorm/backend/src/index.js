const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const app = express();
const PORT = process.env.PORT || 3000;

// 创建数据库连接
const db = new Database('./scorm.db');
console.log('数据库连接成功');

// 初始化数据库
function initDatabase() {
  try {
    // 创建courses表（如果不存在）
    db.exec(`
      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        duration TEXT
      );
    `);
    console.log('课程表已创建');
    
    // 检查是否已有数据，如果没有则插入一些示例数据
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM courses');
    const result = countStmt.get();
    
    if (result.count === 0) {
      const insertStmt = db.prepare(
        'INSERT INTO courses (title, description, duration) VALUES (?, ?, ?)'
      );
      
      const examples = [
        { title: 'SCORM基础课程', description: 'SCORM标准的入门课程', duration: '2小时' },
        { title: '高级SCORM应用', description: '深入学习SCORM高级特性', duration: '3小时' }
      ];
      
      for (const course of examples) {
        insertStmt.run(course.title, course.description, course.duration);
      }
      console.log('示例课程数据已插入');
    }
  } catch (error) {
    console.error('初始化数据库失败:', error.message);
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
    console.log('获取所有课程:', courses.length, '门');
    res.json(courses);
  } catch (error) {
    console.error('获取课程失败:', error.message);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 获取单个课程
app.get('/api/courses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const stmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const course = stmt.get(id);
    
    console.log(`获取课程 ID: ${id}`, course ? '找到' : '未找到');
    
    if (!course) {
      return res.status(404).json({ message: '课程未找到' });
    }
    
    res.json(course);
  } catch (error) {
    console.error('获取课程失败:', error.message);
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
    
    const insertStmt = db.prepare(
      'INSERT INTO courses (title, description, duration) VALUES (?, ?, ?)'
    );
    const info = insertStmt.run(title, description, duration);
    
    console.log('添加课程成功，ID:', info.lastInsertRowid);
    
    const selectStmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const newCourse = selectStmt.get(info.lastInsertRowid);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error('添加课程失败:', error.message);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 更新课程
app.put('/api/courses/:id', (req, res) => {
  try {
    const { title, description, duration } = req.body;
    const id = parseInt(req.params.id);
    
    // 检查课程是否存在
    const checkStmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const check = checkStmt.get(id);
    if (!check) {
      return res.status(404).json({ message: '课程未找到' });
    }
    
    const updateStmt = db.prepare(
      'UPDATE courses SET title = ?, description = ?, duration = ? WHERE id = ?'
    );
    updateStmt.run(title, description, duration, id);
    
    console.log(`更新课程 ID: ${id} 成功`);
    
    const selectStmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const updatedCourse = selectStmt.get(id);
    res.json(updatedCourse);
  } catch (error) {
    console.error('更新课程失败:', error.message);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 删除课程
app.delete('/api/courses/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    // 检查课程是否存在
    const checkStmt = db.prepare('SELECT * FROM courses WHERE id = ?');
    const check = checkStmt.get(id);
    if (!check) {
      return res.status(404).json({ message: '课程未找到' });
    }
    
    const deleteStmt = db.prepare('DELETE FROM courses WHERE id = ?');
    deleteStmt.run(id);
    
    console.log(`删除课程 ID: ${id} 成功`);
    
    res.json({ message: '课程已成功删除' });
  } catch (error) {
    console.error('删除课程失败:', error.message);
    res.status(500).json({ message: '服务器内部错误' });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

// 优雅关闭
process.on('SIGINT', () => {
  db.close();
  console.log('数据库连接已关闭');
  process.exit(0);
});