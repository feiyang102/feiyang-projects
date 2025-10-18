const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const unzipper = require('unzipper');
const app = express();
const PORT = process.env.PORT || 3000;

// 创建scorm目录（如果不存在）
const scormDir = path.join(__dirname, '../scorm');
if (!fs.existsSync(scormDir)) {
  fs.mkdirSync(scormDir, { recursive: true });
  console.log('SCORM目录已创建');
}

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

// 配置multer用于文件上传
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    // 只允许zip文件
    if (file.mimetype === 'application/zip' || file.originalname.endsWith('.zip')) {
      cb(null, true);
    } else {
      cb(new Error('只允许上传zip文件'), false);
    }
  }
});

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

// 上传和解压zip文件的API
app.post('/api/upload-scorm', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: '没有上传文件' });
    }
    
    // 优先使用前端传递的courseName参数，确保中文文件名正确处理
    const fileName = req.body.courseName || decodeURIComponent(encodeURIComponent(path.parse(req.file.originalname).name));
    const courseDir = path.join(scormDir, fileName);
    
    // 如果目录已存在，删除它
    if (fs.existsSync(courseDir)) {
      fs.rmSync(courseDir, { recursive: true, force: true });
      console.log(`已删除已存在的目录: ${courseDir}`);
    }
    
    // 创建目标目录
    fs.mkdirSync(courseDir, { recursive: true });
    
    // 解压文件
    await new Promise((resolve, reject) => {
      const stream = unzipper.Extract({ path: courseDir });
      
      // 监听解压完成事件
      stream.on('close', () => {
        console.log(`文件解压完成: ${fileName}`);
        resolve();
      });
      
      // 监听错误事件
      stream.on('error', (err) => {
        console.error('解压失败:', err);
        reject(err);
      });
      
      // 将文件buffer写入流
      const bufferStream = require('stream').Readable.from(req.file.buffer);
      bufferStream.pipe(stream);
    });
    
    // 返回成功响应
    res.status(201).json({
      message: '文件上传并解压成功',
      courseName: fileName,
      path: `/scorm/${fileName}`
    });
  } catch (error) {
    console.error('文件上传或解压失败:', error.message);
    res.status(500).json({ message: `操作失败: ${error.message}` });
  }
});

// 提供scorm目录的静态文件访问，添加自定义处理确保中文文件名正确
app.use('/scorm', (req, res, next) => {
  // 解码URL路径中的中文文件名
  req.url = decodeURIComponent(req.url);
  next();
}, express.static(scormDir));

// 获取已上传的SCORM课程列表
app.get('/api/scorm-courses', (req, res) => {
  try {
    if (!fs.existsSync(scormDir)) {
      return res.json([]);
    }
    
    const courses = fs.readdirSync(scormDir)
      .filter(file => fs.statSync(path.join(scormDir, file)).isDirectory())
      .map(dirName => ({
        name: decodeURIComponent(encodeURIComponent(dirName)),
        path: `/scorm/${encodeURIComponent(dirName)}`,
        lastModified: fs.statSync(path.join(scormDir, dirName)).mtime
      }));
    
    res.json(courses);
  } catch (error) {
    console.error('获取SCORM课程列表失败:', error.message);
    res.status(500).json({ message: '获取课程列表失败' });
  }
});

// 删除SCORM课程
app.delete('/api/scorm-courses/:courseName', (req, res) => {
  try {
    // 对URL参数进行解码，确保中文文件名正确处理
    const courseName = decodeURIComponent(req.params.courseName);
    const courseDir = path.join(scormDir, courseName);
    
    // 检查目录是否存在
    if (!fs.existsSync(courseDir)) {
      return res.status(404).json({ message: 'SCORM课程不存在' });
    }
    
    // 删除目录及其内容
    fs.rmSync(courseDir, { recursive: true, force: true });
    console.log(`已删除SCORM课程: ${courseName}`);
    
    res.json({ message: 'SCORM课程删除成功' });
  } catch (error) {
    console.error('删除SCORM课程失败:', error.message);
    res.status(500).json({ message: `删除失败: ${error.message}` });
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