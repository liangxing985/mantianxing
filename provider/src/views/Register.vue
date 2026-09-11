<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 左侧品牌区 -->
      <div class="brand-side">
        <div class="brand-content">
          <div class="brand-logo">★</div>
          <h1 class="brand-title">加入漫天星</h1>
          <p class="brand-subtitle">成为陪玩达人，开启接单之旅</p>
          <div class="brand-features">
            <div class="feature-item">
              <span class="feature-icon">🎮</span>
              <span>海量订单实时推送</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">💎</span>
              <span>高分成比例</span>
            </div>
            <div class="feature-item">
              <span class="feature-icon">🏆</span>
              <span>等级体系成长</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="form-side">
        <div class="form-wrapper">
          <div class="form-header">
            <h2 class="form-title">陪玩入驻</h2>
            <span class="back-link" @click="$router.push('/login')">← 返回登录</span>
          </div>
          
          <form @submit.prevent="handleRegister">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">账号</label>
                <input v-model="form.username" class="form-input" placeholder="4-20位字母数字" />
              </div>
              <div class="form-group">
                <label class="form-label">密码</label>
                <input v-model="form.password" type="password" class="form-input" placeholder="至少6位" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input v-model="form.nickname" class="form-input" placeholder="展示给老板的名字" />
              </div>
              <div class="form-group">
                <label class="form-label">手机号</label>
                <input v-model="form.phone" class="form-input" placeholder="用于联系" />
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">个人简介</label>
              <textarea v-model="form.bio" class="form-textarea" rows="3" placeholder="擅长游戏、段位、声音特点等"></textarea>
            </div>
            
            <div class="notice">
              <span class="notice-icon">⚠️</span>
              <span>提交后需等待运营审核，审核通过后即可接单</span>
            </div>
            
            <button type="submit" class="btn btn-primary btn-lg btn-block" :disabled="loading">
              {{ loading ? '提交中...' : '提交申请' }}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { register } from '@/api'

const router = useRouter()
const loading = ref(false)
const form = reactive({ username: '', password: '', nickname: '', phone: '', bio: '' })

const handleRegister = async () => {
  if (!form.username || !form.password || !form.nickname) {
    showToast('请填写必填项')
    return
  }
  loading.value = true
  try {
    await register(form)
    showToast('申请已提交，请等待审核')
    setTimeout(() => router.push('/login'), 1500)
  } finally { 
    loading.value = false 
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  background: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.register-container {
  width: 100%;
  max-width: 960px;
  background: #fff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.1);
  display: flex;
  min-height: 600px;
}

/* 左侧品牌区 */
.brand-side {
  flex: 1;
  background: linear-gradient(135deg, #6c5ce7 0%, #a29bfe 100%);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.brand-content { text-align: center; }

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
  flex: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.form-wrapper {
  width: 100%;
  max-width: 400px;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.form-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
}

.back-link {
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
}

.back-link:hover { color: var(--primary); }

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group { margin-bottom: 20px; }

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 15px;
  color: var(--text-primary);
  background: #fafafa;
  outline: none;
  transition: all 0.2s;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  border-color: var(--primary);
  background: #fff;
  box-shadow: 0 0 0 3px rgba(0,184,148,0.1);
}

.form-textarea { resize: vertical; }

.notice {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff7e6;
  color: #d48806;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 20px;
}

.notice-icon { font-size: 16px; }
</style>
