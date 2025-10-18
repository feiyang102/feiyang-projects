const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 示例数据
const scormCourses = [
  {
    id: 1,
    title: 'SCORM基础课程',
    description: 'SCORM标准的入门课程',
    duration: '2小时'
  },
  {
    id: 2,
    title: '高级SCORM应用',
    description: '深入学习SCORM高级特性',
    duration: '3小时'
  }
];

// API接口示例
app.get('/', (req, res) => {
  res.send('SCORM后端服务正在运行');
});

// 获取所有课程
app.get('/api/courses', (req, res) => {
  res.json(scormCourses);
});

// 获取单个课程
app.get('/api/courses/:id', (req, res) => {
  const course = scormCourses.find(c => c.id === parseInt(req.params.id));
  if (!course) {
    return res.status(404).json({ message: '课程未找到' });
  }
  res.json(course);
});

// 添加新课程
app.post('/api/courses', (req, res) => {
  const newCourse = {
    id: scormCourses.length + 1,
    title: req.body.title,
    description: req.body.description,
    duration: req.body.duration
  };
  scormCourses.push(newCourse);
  res.status(201).json(newCourse);
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});