<template>
  <div class="profile-page">
    <div class="header">
      <van-image round width="64" height="64" :src="user?.avatar || defaultAvatar" />
      <div class="info">
        <h2>{{ user?.nickname }}</h2>
        <p>Lv.{{ profile?.level }} · ⭐{{ profile?.rating?.toFixed(1) }} · {{ profile?.orderCount || 0 }}单</p>
      </div>
    </div>
    <div class="status-bar">
      <div class="status-item">
        <span>在线状态</span>
        <van-switch :model-value="profile?.isOnline" @update:model-value="(v: any) => profile && (profile.isOnline = v)" @change="toggleOnlineStatus" />
      </div>
      <div class="status-item">
        <span>接单开关</span>
        <van-switch :model-value="profile?.acceptOrder" @update:model-value="(v: any) => profile && (profile.acceptOrder = v)" @change="toggleAccept" />
      </div>
    </div>
    <div v-if="profile?.games?.length" class="game-section">
      <div class="game-title">可接游戏</div>
      <div class="game-tags">
        <van-tag v-for="g in profile.games" :key="g.id" plain type="primary" size="medium">{{ g.game?.name }}</van-tag>
      </div>
    </div>
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell title="服务定价" is-link to="/services" icon="gold-coin-o" />
      <van-cell title="我的订单" is-link to="/orders" icon="orders-o" />
      <van-cell title="我的钱包" is-link to="/wallet" icon="balance-o" />
      <van-cell title="消息通知" is-link to="/messages" icon="chat-o" />
    </van-cell-group>
    <van-cell-group inset style="margin-top: 12px;">
      <van-cell title="个人资料" is-link @click="showEdit = true" icon="user-o" />
      <van-cell title="联系客服" is-link icon="service-o" @click="showToast('客服微信: mantianxing_kefu')" />
    </van-cell-group>
    <div style="padding: 20px 16px;">
      <van-button block round plain type="danger" @click="handleLogout">退出登录</van-button>
    </div>
    <van-dialog v-model:show="showEdit" title="编辑资料" show-cancel-button @confirm="saveProfile">
      <div style="padding: 16px;">
        <van-field v-model="editForm.nickname" label="昵称" />
        <van-field v-model="editForm.phone" label="手机号" />
        <van-field v-model="editForm.bio" label="简介" type="textarea" rows="3" />
      </div>
    </van-dialog>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getProfile, updateProfile, getMyProfile, toggleOnline, toggleAcceptOrder } from '@/api'
const router = useRouter()
const user = ref<any>(null); const profile = ref<any>(null)
const showEdit = ref(false)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const editForm = reactive({ nickname: '', phone: '', bio: '' })
const loadData = async () => {
  const [u, p]: any = await Promise.all([getProfile(), getMyProfile()])
  user.value = u
  profile.value = p?.providerProfile || p || {}
  editForm.nickname = u.nickname; editForm.phone = u.phone || ''; editForm.bio = u.bio || ''
}
const saveProfile = async () => { await updateProfile(editForm); showToast('保存成功'); loadData() }
const toggleOnlineStatus = async (val: boolean) => {
  if (!profile.value) return
  profile.value.isOnline = val
  try { await toggleOnline(val) } catch { profile.value.isOnline = !val; showToast('操作失败，请重试') }
}
const toggleAccept = async (val: boolean) => {
  if (!profile.value) return
  profile.value.acceptOrder = val
  try { await toggleAcceptOrder(val) } catch { profile.value.acceptOrder = !val; showToast('操作失败，请重试') }
}
const handleLogout = async () => {
  await showConfirmDialog({ title: '退出登录', message: '确定退出登录吗？' })
  localStorage.removeItem('provider_token'); localStorage.removeItem('provider_user')
  router.push('/login')
}
onMounted(loadData)
</script>
<style scoped>
.header { background: linear-gradient(135deg, #00b894, #55efc4); padding: 30px 20px; display: flex; align-items: center; color: #fff; }
.info { margin-left: 16px; }
.info h2 { font-size: 20px; }
.info p { font-size: 13px; opacity: 0.9; margin-top: 4px; }
.status-bar { background: #fff; margin: -16px 12px 0; border-radius: 12px; padding: 4px 16px; position: relative; z-index: 1; }
.status-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 0; border-bottom: 1px solid #f5f5f5; }
.status-item:last-child { border-bottom: none; }
.game-section { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; }
.game-title { font-size: 14px; font-weight: 600; margin-bottom: 10px; color: #333; }
.game-tags { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
