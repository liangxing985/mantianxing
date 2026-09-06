<template>
  <div>
    <van-nav-bar title="陪玩入驻" left-arrow @click-left="$router.back()" />
    <div style="padding: 16px;">
      <van-form @submit="handleRegister">
        <van-cell-group inset>
          <van-field v-model="form.username" label="账号" placeholder="4-20位字母数字" />
          <van-field v-model="form.password" type="password" label="密码" placeholder="至少6位" />
          <van-field v-model="form.nickname" label="昵称" placeholder="展示给老板的名字" />
          <van-field v-model="form.phone" label="手机号" placeholder="用于联系" />
          <van-field v-model="form.bio" type="textarea" label="个人简介" placeholder="擅长游戏、段位、声音特点等" rows="3" />
        </van-cell-group>
        <div style="margin: 16px 0; padding: 12px; background: #fdf6ec; color: #e6a23c; border-radius: 8px; font-size: 13px;">
          提交后需等待运营审核，审核通过后即可接单
        </div>
        <van-button round block type="primary" native-type="submit" :loading="loading">提交申请</van-button>
      </van-form>
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
  loading.value = true
  try {
    await register(form)
    showToast('申请已提交，请等待审核')
    setTimeout(() => router.push('/login'), 1500)
  } finally { loading.value = false }
}
</script>
