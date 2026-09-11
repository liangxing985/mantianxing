<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 左侧品牌区 -->
      <div class="brand-section">
        <div class="brand-content">
          <div class="brand-logo">★</div>
          <h1 class="brand-title">加入漫天星</h1>
          <p class="brand-subtitle">开启你的电竞陪玩之旅</p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">🎮</span>
              <span>海量优质陪玩任你选</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💰</span>
              <span>星石支付安全便捷</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🏆</span>
              <span>专业服务品质保障</span>
            </div>
          </div>
        </div>
        <div class="brand-decoration">
          <div class="deco-star star1">★</div>
          <div class="deco-star star2">★</div>
          <div class="deco-star star3">★</div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="form-section">
        <div class="form-card">
          <h2 class="form-title">创建账户</h2>
          <p class="form-subtitle">填写信息完成注册</p>
          
          <form @submit.prevent="handleRegister">
            <div class="form-item">
              <label class="form-label">用户名 <span class="required">*</span></label>
              <input 
                v-model="form.username" 
                class="form-input" 
                placeholder="4-20位字母数字" 
                autocomplete="username"
              />
            </div>
            <div class="form-item">
              <label class="form-label">密码 <span class="required">*</span></label>
              <input 
                v-model="form.password" 
                type="password" 
                class="form-input" 
                placeholder="至少6位" 
                autocomplete="new-password"
              />
            </div>
            <div class="form-item">
              <label class="form-label">昵称 <span class="required">*</span></label>
              <input 
                v-model="form.nickname" 
                class="form-input" 
                placeholder="显示给陪玩的名字" 
              />
            </div>
            <div class="form-item">
              <label class="form-label">手机号</label>
              <input 
                v-model="form.phone" 
                class="form-input" 
                placeholder="选填，用于找回密码" 
                type="tel"
              />
            </div>
            <button type="submit" class="submit-btn" :disabled="loading">
              {{ loading ? '注册中...' : '注 册' }}
            </button>
          </form>

          <div class="form-links">
            <span>已有账号？</span>
            <span class="login-link" @click="$router.push('/login')">立即登录</span>
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
import { register, login } from '@/api'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '', nickname: '', phone: '' })

const handleRegister = async () => {
  if (!form.username || !form.password || !form.nickname) {
    showToast('请填写必填项')
    return
  }
  if (form.username.length < 4 || form.username.length > 20) {
    showToast('用户名需要4-20位')
    return
  }
  if (form.password.length < 6) {
    showToast('密码至少6位')
    return
  }
  loading.value = true
  try {
    await register(form)
    showToast('注册成功，正在登录...')
    const res: any = await login({ username: form.username, password: form.password })
    localStorage.setItem('client_token', res.token)
    localStorage.setItem('client_user', JSON.stringify(res.user))
    router.push('/home')
  } catch (e: any) {
    showToast(e?.message || '注册失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f0f2f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 960px;
  width: 100%;
  min-height: 600px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

/* 左侧品牌区 */
.brand-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 40px;
  color: #fff;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.brand-content {
  position: relative;
  z-index: 1;
}

.brand-logo {
  width: 80px;
  height: 80px;
  line-height: 80px;
  text-align: center;
  background: rgba(255,255,255,0.2);
  font-size: 40px;
  border-radius: 20px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
}

.brand-title {
  font-size: 36px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: 2px;
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
  opacity: 0.95;
}

.feature-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  line-height: 36px;
  text-align: center;
  background: rgba(255,255,255,0.15);
  border-radius: 10px;
}

.brand-decoration {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.deco-star {
  position: absolute;
  color: rgba(255,255,255,0.1);
  font-size: 80px;
}

.star1 { top: 10%; right: 10%; font-size: 100px; }
.star2 { top: 50%; right: 20%; font-size: 60px; }
.star3 { bottom: 10%; right: 5%; font-size: 80px; }

/* 右侧表单区 */
.form-section {
  padding: 48px 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-card {
  width: 100%;
  max-width: 360px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.form-subtitle {
  font-size: 15px;
  color: #999;
  margin-bottom: 32px;
}

.form-item {
  margin-bottom: 18px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #f5222d;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
  transition: all 0.2s;
  background: #fafafa;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #6c5ce7;
  background: #fff;
  box-shadow: 0 0 0 3px rgba(108,92,231,0.1);
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 8px;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(108,92,231,0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-links {
  text-align: center;
  margin-top: 24px;
  font-size: 14px;
  color: #999;
}

.login-link {
  color: #6c5ce7;
  cursor: pointer;
  font-weight: 500;
  margin-left: 4px;
}

.login-link:hover {
  text-decoration: underline;
}

/* 响应式 */
@media (max-width: 768px) {
  .register-container {
    grid-template-columns: 1fr;
  }
  .brand-section {
    display: none;
  }
  .form-section {
    padding: 40px 24px;
  }
}
</style>
