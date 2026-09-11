<template>
  <div class="layout">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-icon">★</span>
        <span class="logo-text">漫天星电竞</span>
      </div>
      <div class="user-info">
        <img :src="user?.avatar || defaultAvatar" class="user-avatar" />
        <div class="user-detail">
          <div class="user-name">{{ user?.nickname || '陪玩' }}</div>
          <div class="user-level">Lv.{{ profile?.level || 1 }}</div>
        </div>
      </div>
      <nav class="nav-menu">
        <div 
          v-for="item in menuItems" 
          :key="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="goTo(item.path)"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span class="nav-label">{{ item.label }}</span>
        </div>
      </nav>
      <div class="sidebar-footer">
        <div class="status-item">
          <span class="status-label">在线状态</span>
          <div 
            class="switch" 
            :class="{ active: profile?.isOnline }"
            @click="toggleOnline"
          >
            <div class="switch-dot"></div>
          </div>
        </div>
        <div class="status-item">
          <span class="status-label">接单开关</span>
          <div 
            class="switch" 
            :class="{ active: profile?.acceptOrder }"
            @click="toggleAccept"
          >
            <div class="switch-dot"></div>
          </div>
        </div>
      </div>
    </aside>

    <!-- 主内容区 -->
    <main class="main">
      <header class="topbar">
        <h1 class="page-title">{{ currentTitle }}</h1>
        <div class="topbar-right">
          <span class="balance-tag">💰 {{ wallet?.balance || 0 }} 星石</span>
        </div>
      </header>
      <div class="content">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getProfile, getMyProfile, getWallet, toggleOnline as apiToggleOnline, toggleAcceptOrder as apiToggleAcceptOrder } from '@/api'

const route = useRoute()
const router = useRouter()
const user = ref<any>(null)
const profile = ref<any>(null)
const wallet = ref<any>(null)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const menuItems = [
  { path: '/pool', label: '抢单大厅', icon: '🔥' },
  { path: '/orders', label: '我的订单', icon: '📋' },
  { path: '/wallet', label: '我的钱包', icon: '💳' },
  { path: '/services', label: '服务管理', icon: '💰' },
  { path: '/my-games', label: '可接游戏', icon: '🎮' },
  { path: '/messages', label: '消息通知', icon: '💬' },
  { path: '/profile', label: '个人中心', icon: '👤' },
]

const currentTitle = computed(() => {
  const item = menuItems.find(m => isActive(m.path))
  return item?.label || '陪玩端'
})

const isActive = (path: string) => {
  if (path === '/pool') return route.path === '/pool'
  if (path === '/orders') return route.path === '/orders' || route.path.startsWith('/order/')
  return route.path === path || route.path.startsWith(path + '/')
}

const goTo = (path: string) => router.push(path)

const loadData = async () => {
  try {
    const [u, p, w]: any = await Promise.all([getProfile(), getMyProfile(), getWallet()])
    user.value = u
    profile.value = p?.providerProfile || p || {}
    wallet.value = w
  } catch (e) {}
}

const toggleOnline = async () => {
  if (!profile.value) return
  const val = !profile.value.isOnline
  profile.value.isOnline = val
  try {
    await apiToggleOnline(val)
    showToast(val ? '已上线' : '已下线')
  } catch {
    profile.value.isOnline = !val
    showToast('操作失败')
  }
}

const toggleAccept = async () => {
  if (!profile.value) return
  const val = !profile.value.acceptOrder
  profile.value.acceptOrder = val
  try {
    await apiToggleAcceptOrder(val)
    showToast(val ? '已开启接单' : '已关闭接单')
  } catch {
    profile.value.acceptOrder = !val
    showToast('操作失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

/* 侧边栏 */
.sidebar {
  width: 240px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  position: fixed;
  top: 0;
  left: 0;
  bottom: 0;
  z-index: 100;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.logo-icon {
  font-size: 28px;
  color: #fdcb6e;
}

.logo-text {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #fdcb6e, #e17055);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.2);
  object-fit: cover;
}

.user-detail { flex: 1; }
.user-name { font-size: 15px; font-weight: 600; }
.user-level { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }

.nav-menu {
  flex: 1;
  padding: 12px 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: rgba(255,255,255,0.08);
}

.nav-item.active {
  background: rgba(0,184,148,0.15);
  border-left-color: #00b894;
  color: #55efc4;
}

.nav-icon { font-size: 18px; }
.nav-label { font-size: 14px; font-weight: 500; }

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.status-label { font-size: 13px; color: rgba(255,255,255,0.7); }

.switch {
  width: 40px;
  height: 22px;
  background: rgba(255,255,255,0.2);
  border-radius: 11px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s;
}

.switch.active { background: #00b894; }

.switch-dot {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: all 0.3s;
}

.switch.active .switch-dot { left: 20px; }

/* 主内容区 */
.main {
  flex: 1;
  margin-left: 240px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.topbar {
  height: 64px;
  background: #fff;
  border-bottom: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  position: sticky;
  top: 0;
  z-index: 50;
}

.page-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.balance-tag {
  background: linear-gradient(135deg, #fff7e6, #ffeaa7);
  color: #d48806;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 600;
}

.content {
  flex: 1;
  padding: 24px 32px;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}
</style>
