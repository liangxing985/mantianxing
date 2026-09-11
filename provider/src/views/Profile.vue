<template>
  <div class="profile-page">
    <div class="profile-grid">
      <!-- 左侧：个人信息 -->
      <div class="profile-card">
        <div class="avatar-section">
          <img :src="user?.avatar || defaultAvatar" class="user-avatar" />
          <h2 class="user-name">{{ user?.nickname || '未登录' }}</h2>
          <div class="user-badges">
            <span class="badge">Lv.{{ profile?.level || 1 }}</span>
            <span class="badge">⭐ {{ profile?.rating?.toFixed(1) || '5.0' }}</span>
            <span class="badge">📦 {{ profile?.orderCount || 0 }}单</span>
          </div>
        </div>
        
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">手机号</span>
            <span class="info-value">{{ user?.phone || '未绑定' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">在线状态</span>
            <span class="info-value">
              <div 
                class="switch-sm" 
                :class="{ active: profile?.isOnline }"
                @click="toggleOnlineStatus(!profile?.isOnline)"
              >
                <div class="switch-dot"></div>
              </div>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">接单开关</span>
            <span class="info-value">
              <div 
                class="switch-sm" 
                :class="{ active: profile?.acceptOrder }"
                @click="toggleAccept(!profile?.acceptOrder)"
              >
                <div class="switch-dot"></div>
              </div>
            </span>
          </div>
        </div>

        <div class="profile-actions">
          <button class="btn btn-primary btn-block" @click="showEdit = true">编辑资料</button>
          <button class="btn btn-outline btn-block" @click="contactService">联系客服</button>
          <button class="btn btn-danger btn-block" @click="handleLogout">退出登录</button>
        </div>
      </div>

      <!-- 右侧：可接游戏 + 简介 -->
      <div class="right-col">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">可接游戏</h3>
            <button class="btn btn-outline btn-sm" @click="router.push('/my-games')">管理</button>
          </div>
          <div class="card-body">
            <div v-if="profile?.games?.length" class="game-tags">
              <span v-for="g in profile.games" :key="g.id" class="game-tag">{{ g.game?.name }}</span>
            </div>
            <div v-else class="empty-inline">
              <span>暂未设置可接游戏</span>
              <span class="link" @click="router.push('/my-games')">去设置</span>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">个人简介</h3>
          </div>
          <div class="card-body">
            <p class="bio-text">{{ user?.bio || '这个人很懒，什么都没留下~' }}</p>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <h3 class="card-title">数据统计</h3>
          </div>
          <div class="card-body">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-num">{{ profile?.orderCount || 0 }}</div>
                <div class="stat-label">完成订单</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">{{ profile?.rating?.toFixed(1) || '5.0' }}</div>
                <div class="stat-label">综合评分</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">Lv.{{ profile?.level || 1 }}</div>
                <div class="stat-label">当前等级</div>
              </div>
              <div class="stat-item">
                <div class="stat-num">{{ profile?.isOnline ? '在线' : '离线' }}</div>
                <div class="stat-label">当前状态</div>
              </div>
            </div>
          </div>
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
          <div class="form-group">
            <label class="form-label">昵称</label>
            <input v-model="editForm.nickname" class="form-input" placeholder="请输入昵称" />
          </div>
          <div class="form-group">
            <label class="form-label">手机号</label>
            <input v-model="editForm.phone" class="form-input" placeholder="请输入手机号" />
          </div>
          <div class="form-group">
            <label class="form-label">简介</label>
            <textarea v-model="editForm.bio" class="form-textarea" rows="3" placeholder="介绍一下自己吧"></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showEdit = false">取消</button>
          <button class="btn btn-primary" @click="saveProfile">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getProfile, updateProfile, getMyProfile, toggleOnline, toggleAcceptOrder } from '@/api'

const router = useRouter()
const user = ref<any>(null)
const profile = ref<any>(null)
const showEdit = ref(false)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const editForm = reactive({ nickname: '', phone: '', bio: '' })

const loadData = async () => {
  const [u, p]: any = await Promise.all([getProfile(), getMyProfile()])
  user.value = u
  profile.value = p?.providerProfile || p || {}
  editForm.nickname = u.nickname
  editForm.phone = u.phone || ''
  editForm.bio = u.bio || ''
}

const saveProfile = async () => {
  await updateProfile(editForm)
  showToast('保存成功')
  showEdit.value = false
  loadData()
}

const toggleOnlineStatus = async (val: boolean) => {
  if (!profile.value) return
  profile.value.isOnline = val
  try {
    await toggleOnline(val)
    showToast(val ? '已上线' : '已下线')
  } catch {
    profile.value.isOnline = !val
    showToast('操作失败，请重试')
  }
}

const toggleAccept = async (val: boolean) => {
  if (!profile.value) return
  profile.value.acceptOrder = val
  try {
    await toggleAcceptOrder(val)
    showToast(val ? '已开启接单' : '已关闭接单')
  } catch {
    profile.value.acceptOrder = !val
    showToast('操作失败，请重试')
  }
}

const contactService = () => {
  navigator.clipboard?.writeText('mantianxing_kefu')
  showToast('客服微信号已复制: mantianxing_kefu')
}

const handleLogout = async () => {
  await showConfirmDialog({ title: '退出登录', message: '确定退出登录吗？' })
  localStorage.removeItem('provider_token')
  localStorage.removeItem('provider_user')
  router.push('/login')
}

onMounted(loadData)
</script>

<style scoped>
.profile-page { padding: 0; }

.profile-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 24px;
}

/* 左侧卡片 */
.profile-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 32px 24px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  height: fit-content;
}

.avatar-section {
  text-align: center;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.user-avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  border: 4px solid #e6f7f0;
  object-fit: cover;
  margin-bottom: 16px;
}

.user-name {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 12px;
}

.user-badges {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  background: #f0f7ff;
  color: #1890ff;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.info-list {
  padding: 20px 0;
  border-bottom: 1px solid var(--border-color);
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.info-label { font-size: 14px; color: var(--text-secondary); }
.info-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }

.switch-sm {
  width: 36px;
  height: 20px;
  background: #d1d5db;
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
  display: inline-block;
}

.switch-sm.active { background: var(--primary); }

.switch-sm .switch-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.3s;
}

.switch-sm.active .switch-dot { left: 18px; }

.profile-actions {
  padding-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 右侧 */
.right-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 16px;
}

.card-title { font-size: 17px; font-weight: 600; color: var(--text-primary); }

.game-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.game-tag {
  background: #e6f7f0;
  color: var(--primary);
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
}

.empty-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-muted);
}

.link { color: var(--primary); cursor: pointer; font-weight: 500; }

.bio-text {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.8;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item { text-align: center; }
.stat-num { font-size: 24px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; }
.stat-label { font-size: 12px; color: var(--text-muted); }

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  width: 480px;
  max-width: 90vw;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 { font-size: 18px; font-weight: 600; }
.modal-close { font-size: 24px; color: var(--text-muted); cursor: pointer; line-height: 1; }

.modal-body { padding: 24px; }

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.modal-footer .btn { flex: 1; }
</style>
