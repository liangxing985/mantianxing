<template>
  <div class="login-container">
    <div class="login-wrapper">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="brand-content">
          <div class="brand-logo">★</div>
          <h1 class="brand-title">漫天星电竞</h1>
          <p class="brand-subtitle">陪玩管理平台运营后台</p>
          <div class="brand-features">
            <div class="feature">
              <span class="feature-icon">📊</span>
              <span>实时数据监控</span>
            </div>
            <div class="feature">
              <span class="feature-icon">⚡</span>
              <span>高效订单管理</span>
            </div>
            <div class="feature">
              <span class="feature-icon">🔒</span>
              <span>安全权限控制</span>
            </div>
          </div>
        </div>
        <div class="brand-decoration"></div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-side">
        <div class="form-wrapper">
          <h2 class="form-title">欢迎登录</h2>
          <p class="form-desc">请输入您的账号信息</p>
          
          <el-form ref="formRef" :model="form" :rules="rules" class="login-form">
            <el-form-item prop="username">
              <el-input 
                v-model="form.username" 
                placeholder="请输入用户名" 
                size="large" 
                :prefix-icon="User"
                class="form-input"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input 
                v-model="form.password" 
                type="password" 
                placeholder="请输入密码" 
                size="large" 
                :prefix-icon="Lock" 
                show-password
                class="form-input"
                @keyup.enter="handleLogin"
              />
            </el-form-item>
            <el-button 
              type="primary" 
              size="large" 
              class="login-btn" 
              :loading="loading" 
              @click="handleLogin"
            >
              登 录
            </el-button>
          </el-form>

          <div class="login-tip">
            <span>默认管理员：admin / admin123</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Lock } from '@element-plus/icons-vue'
import { login } from '@/api'

const router = useRouter()
const formRef = ref()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

const handleLogin = async () => {
  await formRef.value.validate()
  loading.value = true
  try {
    const res: any = await login(form)
    if (res.user.role !== 'ADMIN' && res.user.role !== 'OPERATOR') {
      ElMessage.error('该账号无管理后台权限')
      return
    }
    localStorage.setItem('admin_token', res.token)
    localStorage.setItem('admin_user', JSON.stringify(res.user))
    ElMessage.success('登录成功')
    router.push('/dashboard')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-wrapper {
  width: 100%;
  max-width: 900px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.2);
  display: flex;
  min-height: 520px;
}

/* 左侧品牌区 */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #1a1b2e 0%, #2d2f5e 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-content {
  text-align: center;
  padding: 40px;
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 72px;
  height: 72px;
  line-height: 72px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #fdcb6e, #e17055);
  font-size: 36px;
  border-radius: 18px;
  box-shadow: 0 8px 24px rgba(253,203,110,0.3);
}

.brand-title {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.brand-subtitle {
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.feature {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  background: rgba(255,255,255,0.08);
  padding: 12px 20px;
  border-radius: 10px;
  backdrop-filter: blur(10px);
}

.feature-icon { font-size: 20px; }

.brand-decoration {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(108,92,231,0.3) 0%, transparent 70%);
  border-radius: 50%;
  top: -100px;
  right: -100px;
}

/* 右侧表单 */
.form-side {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 340px;
}

.form-title {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
  margin-bottom: 8px;
}

.form-desc {
  font-size: 14px;
  color: #909399;
  margin-bottom: 32px;
}

.login-form {
  margin-bottom: 24px;
}

:deep(.form-input .el-input__wrapper) {
  padding: 4px 15px;
  border-radius: 10px;
  box-shadow: 0 0 0 1px #e4e7ed inset;
}

:deep(.form-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.form-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #6c5ce7 inset;
}

.login-btn {
  width: 100%;
  height: 46px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  border: none;
  margin-top: 8px;
}

.login-btn:hover {
  opacity: 0.9;
}

.login-tip {
  text-align: center;
  font-size: 12px;
  color: #c0c4cc;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 8px;
}
</style>
