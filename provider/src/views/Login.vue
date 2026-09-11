<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="brand-content">
          <div class="brand-logo">★</div>
          <h1 class="brand-title">漫天星电竞</h1>
          <p class="brand-subtitle">陪玩接单管理平台</p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">🔥</span>
              <span>实时抢单大厅</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💰</span>
              <span>透明收入结算</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">📊</span>
              <span>数据统计分析</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-side">
        <div class="form-wrapper">
          <h2 class="form-title">陪玩登录</h2>
          <p class="form-desc">欢迎回来，请登录您的账号</p>
          
          <form @submit.prevent="handleLogin">
            <div class="form-group">
              <label class="form-label">账号</label>
              <input 
                v-model="form.username" 
                class="form-input" 
                placeholder="请输入账号"
                autocomplete="username"
              />
            </div>
            
            <div class="form-group">
              <label class="form-label">密码</label>
              <input 
                v-model="form.password" 
                type="password" 
                class="form-input" 
                placeholder="请输入密码"
                autocomplete="current-password"
              />
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
              {{ loading ? '登录中...' : '登 录' }}
            </button>
          </form>

          <div class="form-footer">
            <span>还没有账号？</span>
            <span class="link" @click="$router.push('/register')">申请入驻陪玩</span>
          </div>

          <div class="test-tip">
            <p>测试账号：pw001 / test1234</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { login } from '@/api'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

const handleLogin = async () => {
  if (!form.username || !form.password) {
    showToast('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    const res: any = await login(form)
    if (res.user.role !== 'PROVIDER') { 
      showToast('请使用陪玩账号登录')
      return 
    }
    localStorage.setItem('provider_token', res.token)
    localStorage.setItem('provider_user', JSON.stringify(res.user))
    showToast('登录成功')
    router.push('/pool')
  } finally { 
    loading.value = false 
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.login-container {
  width: 100%;
  max-width: 960px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  display: flex;
  min-height: 560px;
}

/* 左侧品牌区 */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #00b894 0%, #55efc4 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.brand-content {
  text-align: center;
}

.brand-logo {
  width: 80px;
  height: 80px;
  line-height: 80px;
  margin: 0 auto 24px;
  background: rgba(255,255,255,0.2);
  font-size: 40px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.brand-subtitle {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 40px;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  background: rgba(255,255,255,0.15);
  padding: 12px 20px;
  border-radius: 12px;
  backdrop-filter: blur(10px);
}

.feature-icon { font-size: 20px; }

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
  max-width: 360px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-desc {
  font-size: 14px;
  color: var(--text-secondary);
  margin-bottom: 32px;
}

.form-group { margin-bottom: 20px; }

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 15px;
  color: var(--text-primary);
  background: #fafafa;
  outline: none;
  transition: all 0.2s;
}

.form-input:focus {
  border-color: var(--primary);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,184,148,0.1);
}

.form-footer {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: var(--text-secondary);
}

.link {
  color: var(--primary);
  cursor: pointer;
  font-weight: 500;
  margin-left: 4px;
}

.test-tip {
  text-align: center;
  margin-top: 32px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--text-muted);
}
</style>
