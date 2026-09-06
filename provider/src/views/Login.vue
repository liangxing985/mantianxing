<template>
  <div class="login-page">
    <div class="logo-area">
      <div class="logo">★</div>
      <h1>漫天星电竞</h1>
      <p>陪玩接单端</p>
    </div>
    <van-form @submit="handleLogin">
      <van-cell-group inset>
        <van-field v-model="form.username" label="账号" placeholder="请输入账号" />
        <van-field v-model="form.password" type="password" label="密码" placeholder="请输入密码" />
      </van-cell-group>
      <div style="margin: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">登录</van-button>
      </div>
    </van-form>
    <div class="links"><span @click="$router.push('/register')">申请入驻陪玩</span></div>
    <div class="tip"><p>测试账号：pw001 / test1234</p></div>
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
  loading.value = true
  try {
    const res: any = await login(form)
    if (res.user.role !== 'PROVIDER') { showToast('请使用陪玩账号登录'); return }
    localStorage.setItem('provider_token', res.token)
    localStorage.setItem('provider_user', JSON.stringify(res.user))
    showToast('登录成功')
    router.push('/pool')
  } finally { loading.value = false }
}
</script>
<style scoped>
.login-page { min-height: 100vh; background: linear-gradient(180deg, #00b894 0%, #55efc4 50%, #f5f6fa 100%); padding-top: 80px; }
.logo-area { text-align: center; color: #fff; margin-bottom: 40px; }
.logo { width: 70px; height: 70px; line-height: 70px; margin: 0 auto 16px; background: #fff; color: #00b894; font-size: 36px; border-radius: 50%; font-weight: bold; }
.logo-area h1 { font-size: 24px; margin-bottom: 4px; }
.logo-area p { font-size: 14px; opacity: 0.8; }
.links { text-align: center; color: #00b894; font-size: 14px; }
.tip { text-align: center; margin-top: 40px; color: #999; font-size: 12px; }
</style>
