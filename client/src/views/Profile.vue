<template>
  <div class="profile-page">
    <div class="page-header">
      <h1 class="page-title">个人中心</h1>
      <p class="page-subtitle">管理你的账户和设置</p>
    </div>

    <div class="profile-content">
      <!-- 左侧：用户信息 -->
      <div class="profile-sidebar">
        <div class="user-card">
          <img :src="user?.avatar || defaultAvatar" class="user-avatar" />
          <h2 class="user-name">{{ isLoggedIn ? (user?.nickname || '用户') : '未登录' }}</h2>
          <p class="user-phone">{{ isLoggedIn ? (user?.phone || '未绑定手机号') : '登录后享受更多服务' }}</p>
          <div v-if="isLoggedIn" class="user-balance">
            <span class="balance-label">星石余额</span>
            <span class="balance-value">{{ wallet?.balance || 0 }}</span>
          </div>
          <div v-if="!isLoggedIn" class="auth-buttons">
            <button class="btn-login" @click="$router.push('/login')">登录</button>
            <button class="btn-register" @click="$router.push('/register')">注册</button>
          </div>
        </div>

        <!-- 快捷数据 -->
        <div v-if="isLoggedIn" class="quick-stats">
          <div class="stat-item">
            <div class="stat-num">{{ orderStats.total || 0 }}</div>
            <div class="stat-label">总订单</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ orderStats.completed || 0 }}</div>
            <div class="stat-label">已完成</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ orderStats.pending || 0 }}</div>
            <div class="stat-label">进行中</div>
          </div>
        </div>
      </div>

      <!-- 右侧：功能菜单 -->
      <div class="profile-main">
        <div v-if="isLoggedIn" class="menu-section">
          <h3 class="menu-title">订单管理</h3>
          <div class="menu-grid">
            <div class="menu-item" @click="$router.push('/orders')">
              <div class="menu-icon">📋</div>
              <div class="menu-text">
                <div class="menu-name">我的订单</div>
                <div class="menu-desc">查看所有订单记录</div>
              </div>
              <span class="menu-arrow">›</span>
            </div>
            <div class="menu-item" @click="$router.push('/wallet')">
              <div class="menu-icon">💰</div>
              <div class="menu-text">
                <div class="menu-name">我的钱包</div>
                <div class="menu-desc">星石余额和收支明细</div>
              </div>
              <span class="menu-arrow">›</span>
            </div>
            <div class="menu-item" @click="$router.push('/messages')">
              <div class="menu-icon">💬</div>
              <div class="menu-text">
                <div class="menu-name">消息通知</div>
                <div class="menu-desc">系统消息和通知</div>
              </div>
              <span class="menu-arrow">›</span>
            </div>
          </div>
        </div>

        <div v-if="isLoggedIn" class="menu-section">
          <h3 class="menu-title">账户设置</h3>
          <div class="menu-grid">
            <div class="menu-item" @click="showEdit = true">
              <div class="menu-icon">👤</div>
              <div class="menu-text">
                <div class="menu-name">个人资料</div>
                <div class="menu-desc">修改昵称、手机号、简介</div>
              </div>
              <span class="menu-arrow">›</span>
            </div>
            <div class="menu-item" @click="contactService">
              <div class="menu-icon">🎧</div>
              <div class="menu-text">
                <div class="menu-name">联系客服</div>
                <div class="menu-desc">微信: mantianxing_kefu</div>
              </div>
              <span class="menu-arrow">›</span>
            </div>
            <div class="menu-item" @click="showAbout = true">
              <div class="menu-icon">ℹ️</div>
              <div class="menu-text">
                <div class="menu-name">关于我们</div>
                <div class="menu-desc">版本信息和介绍</div>
              </div>
              <span class="menu-arrow">›</span>
            </div>
          </div>
        </div>

        <div v-if="isLoggedIn" class="logout-section">
          <button class="btn-logout" @click="handleLogout">退出登录</button>
        </div>

        <div v-if="!isLoggedIn" class="login-prompt">
          <div class="prompt-icon">🔐</div>
          <h3>登录后解锁全部功能</h3>
          <p>登录后可以下单、查看订单、管理钱包</p>
          <button class="btn-login-large" @click="$router.push('/login')">立即登录</button>
        </div>
      </div>
    </div>

    <!-- 编辑资料弹窗 -->
    <div v-if="showEdit" class="modal-overlay" @click="showEdit = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>编辑资料</h3>
          <span class="modal-close" @click="showEdit = false">×</span>
        </div>
        <div class="modal-body">
          <div class="form-item avatar-item">
            <label>头像</label>
            <div class="avatar-upload" @click="triggerAvatarUpload">
              <img :src="editForm.avatar || defaultAvatar" class="avatar-preview" />
              <div class="avatar-overlay">点击更换</div>
              <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
            </div>
          </div>
          <div class="form-item">
            <label>昵称</label>
            <input v-model="editForm.nickname" class="form-input" placeholder="请输入昵称" />
          </div>
          <div class="form-item">
            <label>手机号</label>
            <input v-model="editForm.phone" class="form-input" placeholder="请输入手机号" />
          </div>
          <div class="form-item">
            <label>简介</label>
            <textarea v-model="editForm.bio" class="form-textarea" rows="3" placeholder="介绍一下自己吧"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showEdit = false">取消</button>
          <button class="btn-confirm" @click="saveProfile">保存</button>
        </div>
      </div>
    </div>

    <!-- 关于弹窗 -->
    <div v-if="showAbout" class="modal-overlay" @click="showAbout = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>关于漫天星电竞</h3>
          <span class="modal-close" @click="showAbout = false">×</span>
        </div>
        <div class="modal-body about-body">
          <div class="about-logo">★</div>
          <h4>漫天星电竞 v1.0</h4>
          <p>专业陪玩服务平台</p>
          <p>技术上分 · 声音好听 · 服务周到</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getProfile, updateProfile, getWallet, getMyOrders } from '@/api'

const router = useRouter()
const user = ref<any>(null)
const wallet = ref<any>(null)
const orderStats = ref({ total: 0, completed: 0, pending: 0 })
const showEdit = ref(false)
const showAbout = ref(false)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const editForm = reactive({ nickname: '', phone: '', bio: '', avatar: '' })
const avatarInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    showToast('图片不能超过5MB')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('client_token')
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const data = await res.json()
    if (data?.data?.url) {
      editForm.avatar = data.data.url
      showToast('头像上传成功')
    } else {
      showToast('上传失败')
    }
  } catch (err) {
    showToast('上传失败')
  } finally {
    uploading.value = false
    if (target) target.value = ''
  }
}

const isLoggedIn = computed(() => !!localStorage.getItem('client_token'))

const loadData = async () => {
  if (!isLoggedIn.value) return
  try {
    const [u, w, orders]: any = await Promise.all([
      getProfile(),
      getWallet().catch(() => null),
      getMyOrders({ page: 1, pageSize: 100 }).catch(() => ({ list: [] })),
    ])
    user.value = u
    wallet.value = w
    editForm.nickname = u.nickname
    editForm.phone = u.phone || ''
    editForm.bio = u.bio || ''
    editForm.avatar = u.avatar || ''
    const orderList = orders?.list || orders?.data?.list || []
    orderStats.value = {
      total: orderList.length,
      completed: orderList.filter((o: any) => o.status === 'COMPLETED').length,
      pending: orderList.filter((o: any) => ['PAID', 'ASSIGNED', 'SERVING'].includes(o.status)).length,
    }
  } catch (e) {}
}

const saveProfile = async () => {
  await updateProfile(editForm)
  showToast('保存成功')
  showEdit.value = false
  loadData()
}

const contactService = () => {
  navigator.clipboard?.writeText('mantianxing_kefu')
  showToast('客服微信号已复制: mantianxing_kefu')
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
.profile-page {
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 15px;
  color: #999;
}

.profile-content {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* 左侧 */
.profile-sidebar {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.user-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px 24px;
  text-align: center;
  color: #fff;
  box-shadow: 0 8px 24px rgba(102,126,234,0.3);
}

.user-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.3);
  object-fit: cover;
  margin-bottom: 16px;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 6px;
}

.user-phone {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 16px;
}

.user-balance {
  background: rgba(255,255,255,0.15);
  border-radius: 12px;
  padding: 12px;
  margin-top: 8px;
}

.balance-label {
  font-size: 13px;
  opacity: 0.9;
  display: block;
  margin-bottom: 4px;
}

.balance-value {
  font-size: 28px;
  font-weight: 700;
}

.auth-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-login, .btn-register {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login {
  background: #fff;
  color: #6c5ce7;
  border: none;
}

.btn-register {
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,0.5);
}

.quick-stats {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  justify-content: space-around;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 右侧 */
.profile-main {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-section {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.menu-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 16px;
}

.menu-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.menu-item:hover {
  background: #f5f3ff;
  transform: translateY(-2px);
}

.menu-icon {
  font-size: 28px;
}

.menu-text {
  flex: 1;
}

.menu-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.menu-desc {
  font-size: 12px;
  color: #999;
}

.menu-arrow {
  font-size: 20px;
  color: #ccc;
}

.logout-section {
  text-align: center;
}

.btn-logout {
  background: #fff;
  color: #f5222d;
  border: 1px solid #f5222d;
  padding: 12px 48px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-logout:hover {
  background: #fff1f0;
}

.login-prompt {
  background: #fff;
  border-radius: 12px;
  padding: 60px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.prompt-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.login-prompt h3 {
  font-size: 22px;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.login-prompt p {
  font-size: 14px;
  color: #999;
  margin-bottom: 24px;
}

.btn-login-large {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 14px 48px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-login-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(108,92,231,0.4);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  width: 480px;
  max-width: 90%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-size: 14px;
  color: #333;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input, .form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s;
  font-family: inherit;
}

.form-input:focus, .form-textarea:focus {
  border-color: #6c5ce7;
}

.form-textarea {
  resize: vertical;
}

.avatar-item {
  text-align: center;
}

.avatar-upload {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #e0e0e0;
}

.avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 12px;
  padding: 4px 0;
  text-align: center;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-cancel, .btn-confirm {
  flex: 1;
  padding: 10px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: #f5f5f5;
  color: #666;
  border: none;
}

.btn-confirm {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
}

.about-body {
  text-align: center;
}

.about-logo {
  font-size: 64px;
  color: #6c5ce7;
  margin-bottom: 16px;
}

.about-body h4 {
  font-size: 20px;
  color: #1a1a2e;
  margin-bottom: 12px;
}

.about-body p {
  font-size: 14px;
  color: #666;
  margin: 6px 0;
}
</style>
