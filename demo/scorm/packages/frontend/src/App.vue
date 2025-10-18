<script setup>
import { ref, onMounted, reactive } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const courses = ref([]);
const loading = ref(true);
const form = reactive({
  title: '',
  description: '',
  duration: ''
});
const formRef = ref(null);
const formRules = {
  title: [
    { required: true, message: '请输入课程标题', trigger: 'blur' },
    { min: 2, max: 50, message: '标题长度应在 2 到 50 个字符之间', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入课程描述', trigger: 'blur' }
  ],
  duration: [
    { required: true, message: '请输入课程时长', trigger: 'blur' }
  ]
};

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
    ElMessage.error(`获取课程失败: ${err.message}`);
    console.error('获取课程失败:', err);
  } finally {
    loading.value = false;
  }
};

// 添加新课程
const addCourse = async () => {
  try {
    await formRef.value.validate();
    
    const response = await fetch('http://localhost:3000/api/courses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(form)
    });
    
    if (!response.ok) {
      throw new Error('添加课程失败');
    }
    
    const course = await response.json();
    courses.value.push(course);
    
    // 重置表单
    formRef.value.resetFields();
    ElMessage.success('课程添加成功');
  } catch (err) {
    if (err.message !== '表单验证失败') {
      ElMessage.error(`添加课程失败: ${err.message}`);
    }
    console.error('添加课程失败:', err);
  }
};

// 删除课程
const deleteCourse = async (courseId, courseTitle) => {
  try {
    // 显示确认对话框
    await ElMessageBox.confirm(
      `确定要删除课程「${courseTitle}」吗？此操作不可恢复。`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    );
    
    const response = await fetch(`http://localhost:3000/api/courses/${courseId}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      throw new Error('删除课程失败');
    }
    
    // 从列表中移除删除的课程
    courses.value = courses.value.filter(course => course.id !== courseId);
    ElMessage.success('课程删除成功');
  } catch (err) {
    if (err.message !== 'cancel') {
      ElMessage.error(`删除课程失败: ${err.message}`);
    }
    console.error('删除课程失败:', err);
  }
};

// 刷新课程列表
const refreshCourses = () => {
  fetchCourses();
};

// 组件挂载时获取课程
onMounted(() => {
  fetchCourses();
});
</script>

<template>
  <div class="app-container">
    <el-card shadow="never" class="main-card">
      <template #header>
        <div class="card-header">
          <span>SCORM课程管理系统</span>
          <el-button type="primary" plain @click="refreshCourses">
            <el-icon><Refresh /></el-icon> 刷新列表
          </el-button>
        </div>
      </template>
      
      <!-- 课程列表 -->
      <el-card class="courses-card" shadow="hover">
        <template #header>
          <div class="card-header">
            <span>课程列表</span>
            <span class="course-count">共 {{ courses.length }} 门课程</span>
          </div>
        </template>
        
        <el-skeleton :rows="3" animated v-if="loading" />
        
        <template v-else>
          <div v-if="courses.length === 0" class="no-courses">
            <el-empty description="暂无课程数据" />
          </div>
          
          <div v-else class="course-grid">
            <el-card 
              v-for="course in courses" 
              :key="course.id" 
              class="course-item" 
              shadow="hover" 
              :body-style="{ padding: '20px' }"
            >
              <template #header>
                <div class="course-header">
                  <h3 class="course-title">{{ course.title }}</h3>
                  <div class="course-actions">
                    <el-tag size="small" effect="plain">{{ course.duration }}</el-tag>
                    <el-button 
                      type="danger" 
                      size="small" 
                      circle 
                      @click="deleteCourse(course.id, course.title)"
                      title="删除课程"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </div>
              </template>
              <div class="course-content">
                <p class="course-description">{{ course.description }}</p>
              </div>
            </el-card>
          </div>
        </template>
      </el-card>
      
      <!-- 添加课程表单 -->
      <el-card class="add-course-card" shadow="hover" style="margin-top: 24px;">
        <template #header>
          <div class="card-header">
            <span>添加新课程</span>
          </div>
        </template>
        
        <el-form 
          ref="formRef" 
          :model="form" 
          :rules="formRules" 
          label-width="100px" 
          @submit.prevent="addCourse"
        >
          <el-form-item label="课程标题" prop="title">
            <el-input v-model="form.title" placeholder="请输入课程标题" maxlength="50" show-word-limit />
          </el-form-item>
          
          <el-form-item label="课程描述" prop="description">
            <el-input 
              v-model="form.description" 
              type="textarea" 
              placeholder="请输入课程描述" 
              :rows="3" 
              maxlength="500" 
              show-word-limit 
            />
          </el-form-item>
          
          <el-form-item label="课程时长" prop="duration">
            <el-input v-model="form.duration" placeholder="例如: 2小时" />
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" :loading="loading" @click="addCourse">
              <el-icon><Plus /></el-icon> 添加课程
            </el-button>
            <el-button @click="formRef.resetFields()">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </el-card>
  </div>
</template>

<script>
// 导入Element Plus图标
import {
  Plus,
  Refresh,
  Delete
} from '@element-plus/icons-vue'
</script>

<style scoped>
.app-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.course-count {
  color: #909399;
  font-size: 14px;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-top: 16px;
}

.course-item {
  transition: all 0.3s ease;
}

.course-item:hover {
  transform: translateY(-5px);
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.course-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.course-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.course-description {
  color: #606266;
  line-height: 1.6;
  margin-bottom: 0;
}
</style>
