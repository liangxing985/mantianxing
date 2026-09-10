<template>
  <div class="profile-page">
    <!-- 未登录状态 -->
    <div v-if="!isLoggedIn" class="header">
      <van-image round width="64" height="64" :src="defaultAvatar" />
      <div class="info">
        <h2>未登录</h2>
        <p>登录后享受更多服务</p>
      </div>
    </div>
    <div v-if="!isLoggedIn" style="padding: 20px 16px; display: flex; gap: 12px;">
      <van-button block round type="primary" @click="$router.push('/login')">登录</van-button>
      <van-button block round plain @click="$router.push('/register')">注册</van-button>
    </div>

    <!-- 已登录状态 -->
    <template v-if="isLoggedIn">
      <div class="header">
        <van-image round width="64" height="64" :src="user?.avatar || defaultAvatar" />
        <div class="info">
          <h2>{{ user?.nickname }}</h2>
          <p>{{ user?.phone || '未绑定手机号' }}</p>
        </div>
      </div>

      <van-cell-group inset style="margin-top: 12px;">
        <van-cell title="我的订单" is-link to="/orders" icon="orders-o" />
        <van-cell title="我的钱包" is-link to="/wallet" icon="balance-o" />
        <van-cell title="消息通知" is-link to="/messages" icon="chat-o" />
      </van-cell-group>

      <van-cell-group inset style="margin-top: 12px;">
        <van-cell title="个人资料" is-link @click="showEdit = true" icon="user-o" />
        <van-cell title="联系客服" is-link icon="service-o" @click="contactService" />
        <van-cell title="关于我们" is-link icon="info-o" @click="showAbout = true" />
      </van-cell-group>

      <div style="padding: 20px 16px;">
        <van-button block round plain type="danger" @click="handleLogout">退出登录</van-button>
      </div>
    </template>

    <!-- 编辑资料弹窗 -->
    <van-dialog v-model:show="showEdit" title="编辑资料" show-cancel-button @confirm="saveProfile">
      <div style="padding: 16px;">
        <van-field v-model="editForm.nickname" label="昵称" />
        <van-field v-model="editForm.phone" label="手机号" />
        <van-field v-model="editForm.bio" label="简介" type="textarea" rows="2" />
      </div>
    </van-dialog>

    <!-- 关于弹窗 -->
    <van-dialog v-model:show="showAbout" title="关于漫天星电竞" show-confirm-button>
      <div style="padding: 20px; text-align: center;">
        <div style="font-size: 36px; margin-bottom: 12px;">★</div>
        <p style="color: #666; line-height: 1.8;">
          漫天星电竞 v1.0<br/>
          专业陪玩服务平台<br/>
          技术上分 · 声音好听 · 服务周到
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getProfile, updateProfile } from '@/api'

const router = useRouter()
const user = ref<any>(null)
const showEdit = ref(false)
const showAbout = ref(false)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const editForm = reactive({ nickname: '', phone: '', bio: '' })

const isLoggedIn = computed(() => !!localStorage.getItem('client_token'))

const loadData = async () => {
  if (!isLoggedIn.value) return
  try {
    user.value = await getProfile()
    editForm.nickname = user.value.nickname
    editForm.phone = user.value.phone || ''
    editForm.bio = user.value.bio || ''
  } catch (e) {}
}

const saveProfile = async () => {
  await updateProfile(editForm)
  showToast('保存成功')
  loadData()
}

const contactService = () => {
  showToast('客服微信: mantianxing_kefu')
}

const handleLogout = async () => {
  await showConfirmDialog({ title: '退出登录', message: '确定退出登录吗？' })
  localStorage.removeItem('client_token')
  localStorage.removeItem('client_user')
  router.push('/home')
}

onMounted(loadData)
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  padding: 30px 20px;
  display: flex;
  align-items: center;
  color: #fff;
}
.info { margin-left: 16px; }
.info h2 { font-size: 20px; }
.info p { font-size: 13px; opacity: 0.9; margin-top: 4px; }
</style>
