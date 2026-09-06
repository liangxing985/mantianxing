<template>
  <div class="register-page">
    <van-nav-bar title="注册" left-arrow @click-left="$router.back()" />
    <div style="padding: 16px;">
      <van-form @submit="handleRegister">
        <van-cell-group inset>
          <van-field v-model="form.username" label="用户名" placeholder="4-20位字母数字" :rules="[{ required: true, message: '请输入用户名' }]" />
          <van-field v-model="form.password" type="password" label="密码" placeholder="至少6位" :rules="[{ required: true, message: '请输入密码' }]" />
          <van-field v-model="form.nickname" label="昵称" placeholder="显示给陪玩的名字" :rules="[{ required: true, message: '请输入昵称' }]" />
          <van-field v-model="form.phone" label="手机号" placeholder="选填" />
        </van-cell-group>
        <div style="margin: 16px 0;">
          <van-button round block type="primary" native-type="submit" :loading="loading">注册</van-button>
        </div>
      </van-form>
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
  loading.value = true
  try {
    await register(form)
    showToast('注册成功，正在登录...')
    const res: any = await login({ username: form.username, password: form.password })
    localStorage.setItem('client_token', res.token)
    localStorage.setItem('client_user', JSON.stringify(res.user))
    router.push('/home')
  } finally {
    loading.value = false
  }
}
</script>
