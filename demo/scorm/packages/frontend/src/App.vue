<script setup>
import { ref, onMounted } from 'vue';

const courses = ref([]);
const loading = ref(true);
const error = ref(null);
const newCourse = ref({
  title: '',
  description: '',
  duration: ''
});

// 加载课程列表
const fetchCourses = async () => {
  try {
    loading.value = true;
    const response = await fetch('http://localhost:3000/api/courses');
    if (!response.ok) {
      throw new Error('网络响应错误');
    }
    courses.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error('获取课程失败:', err);
  } finally {
    loading.value = false;
  }
};

// 添加新课程
const addCourse = async () => {
  try {
    const response = await fetch('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newCourse.value)
    });
    
    if (!response.ok) {
      throw new Error('添加课程失败');
    }
    
    const course = await response.json();
    courses.value.push(course);
    
    // 重置表单
    newCourse.value = {
      title: '',
      description: '',
      duration: ''
    };
  } catch (err) {
    error.value = err.message;
    console.error('添加课程失败:', err);
  }
};

// 组件挂载时获取课程
onMounted(() => {
  fetchCourses();
});
</script>

<template>
  <div class="app-container">
    <h1>SCORM课程管理</h1>
    
    <!-- 错误提示 -->
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>
    
    <!-- 课程列表 -->
    <div v-else class="courses-container">
      <h2>课程列表</h2>
      <div v-if="courses.length === 0" class="no-courses">
        暂无课程数据
      </div>
      <div v-else class="course-list">
        <div v-for="course in courses" :key="course.id" class="course-item">
          <h3>{{ course.title }}</h3>
          <p>{{ course.description }}</p>
          <span class="duration">时长: {{ course.duration }}</span>
        </div>
      </div>
    </div>
    
    <!-- 添加课程表单 -->
    <div class="add-course-container">
      <h2>添加新课程</h2>
      <form @submit.prevent="addCourse">
        <div class="form-group">
          <label for="title">课程标题</label>
          <input type="text" id="title" v-model="newCourse.title" required>
        </div>
        <div class="form-group">
          <label for="description">课程描述</label>
          <textarea id="description" v-model="newCourse.description" required></textarea>
        </div>
        <div class="form-group">
          <label for="duration">课程时长</label>
          <input type="text" id="duration" v-model="newCourse.duration" required>
        </div>
        <button type="submit" class="add-btn">添加课程</button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 30px;
}

h2 {
  color: #555;
  margin-bottom: 15px;
  border-bottom: 1px solid #ddd;
  padding-bottom: 10px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.courses-container,
.add-course-container {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 30px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.course-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.course-item {
  background-color: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.course-item h3 {
  margin-top: 0;
  color: #2196f3;
}

.course-item p {
  color: #666;
  margin-bottom: 10px;
}

.duration {
  font-size: 0.9em;
  color: #888;
  background-color: #f0f0f0;
  padding: 3px 8px;
  border-radius: 3px;
}

.no-courses {
  text-align: center;
  padding: 30px;
  color: #888;
}

.form-group {
  margin-bottom: 15px;
}

label {
  display: block;
  margin-bottom: 5px;
  color: #555;
  font-weight: bold;
}

input, textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.add-btn {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

.add-btn:hover {
  background-color: #45a049;
}
</style>
