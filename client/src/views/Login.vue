<template>
  <div class="login-page">
    <div class="logo-area">
      <div class="logo">★</div>
      <h1>漫天星电竞</h1>
      <p>专业陪玩，技术上分</p>
    </div>
    <div class="form-area">
      <van-form @submit="handleLogin">
        <van-cell-group inset>
          <van-field v-model="form.username" label="用户名" placeholder="请输入用户名" :rules="[{ required: true, message: '请输入用户名' }]" />
          <van-field v-model="form.password" type="password" label="密码" placeholder="请输入密码" :rules="[{ required: true, message: '请输入密码' }]" />
        </van-cell-group>
        <div style="margin: 16px;">
          <van-button round block type="primary" native-type="submit" :loading="loading">登录</van-button>
        </div>
      </van-form>
      <div class="links">
        <span @click="$router.push('/register')">注册账号</span>
      </div>
      <div class="tip">
        <p>测试账号：boss001 / test1234</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showToast } from 'vant'
import { login } from '@/api'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const form = reactive({ username: '', password: '' })

const handleLogin = async () => {
  loading.value = true
  try {
    const res: any = await login(form)
    if (res.user.role !== 'CUSTOMER') {
      showToast('请使用老板账号登录')
      return
    }
    localStorage.setItem('client_token', res.token)
    localStorage.setItem('client_user', JSON.stringify(res.user))
    showToast('登录成功')
    const redirect = route.query.redirect as string
    router.push(redirect || '/home')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #6c5ce7 0%, #a29bfe 50%, #f5f6fa 100%);
  padding-top: 80px;
}
.logo-area {
  text-align: center;
  color: #fff;
  margin-bottom: 40px;
}
.logo {
  width: 70px;
  height: 70px;
  line-height: 70px;
  margin: 0 auto 16px;
  background: #fff;
  color: #6c5ce7;
  font-size: 36px;
  border-radius: 50%;
  font-weight: bold;
}
.logo-area h1 {
  font-size: 24px;
  margin-bottom: 4px;
}
.logo-area p {
  font-size: 14px;
  opacity: 0.8;
}
.links {
  text-align: center;
  color: #6c5ce7;
  font-size: 14px;
}
.tip {
  text-align: center;
  margin-top: 40px;
  color: #999;
  font-size: 12px;
}
</style>
