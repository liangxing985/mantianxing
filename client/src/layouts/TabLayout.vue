<template>
  <div class="tab-layout">
    <!-- 顶部导航栏 -->
    <header class="header">
      <div class="header-inner">
        <div class="logo" @click="$router.push('/home')">
          <span class="logo-icon">★</span>
          <span class="logo-text">漫天星电竞</span>
        </div>
        <nav class="nav-menu">
          <router-link to="/home" class="nav-item" active-class="active">首页</router-link>
          <router-link to="/providers" class="nav-item" active-class="active">陪玩大厅</router-link>
          <router-link to="/orders" class="nav-item" active-class="active">我的订单</router-link>
          <router-link to="/wallet" class="nav-item" active-class="active">我的钱包</router-link>
        </nav>
        <div class="header-right">
          <div v-if="userInfo" class="user-info" @click="$router.push('/profile')">
            <img :src="userInfo.avatar || defaultAvatar" class="user-avatar" />
            <span class="user-name">{{ userInfo.nickname }}</span>
            <span class="user-balance">{{ userInfo.balance || 0 }} 星石</span>
          </div>
          <button v-else class="login-btn" @click="$router.push('/login')">登录</button>
        </div>
      </div>
    </header>

    <!-- 内容区域 -->
    <main class="content">
      <router-view />
    </main>

    <!-- 页脚 -->
    <footer class="footer">
      <div class="footer-inner">
        <p>© 2026 漫天星电竞 版权所有</p>
        <p>专业陪玩 · 技术上分 · 声音好听</p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getProfile } from '@/api'

const userInfo = ref<any>(null)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadUser = async () => {
  const token = localStorage.getItem('client_token')
  if (!token) return
  try {
    const res: any = await getProfile()
    userInfo.value = res
  } catch (e) {
    console.error('load user error', e)
  }
}

onMounted(loadUser)
</script>

<style scoped>
.tab-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.header {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.logo-icon {
  font-size: 24px;
  color: #6c5ce7;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.nav-menu {
  display: flex;
  gap: 8px;
}

.nav-item {
  padding: 8px 20px;
  color: #666;
  text-decoration: none;
  font-size: 15px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.2s;
}

.nav-item:hover {
  color: #6c5ce7;
  background: #f5f3ff;
}

.nav-item.active {
  color: #6c5ce7;
  background: #f5f3ff;
  font-weight: 600;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 24px;
  transition: background 0.2s;
}

.user-info:hover {
  background: #f5f3ff;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-name {
  font-size: 14px;
  color: #333;
  font-weight: 500;
}

.user-balance {
  font-size: 13px;
  color: #6c5ce7;
  font-weight: 600;
  background: #f5f3ff;
  padding: 2px 10px;
  border-radius: 12px;
}

.login-btn {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 8px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.login-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108, 92, 231, 0.4);
}

/* 内容区域 */
.content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 24px;
}

/* 页脚 */
.footer {
  background: #fff;
  border-top: 1px solid #eee;
  padding: 24px 0;
  margin-top: 40px;
}

.footer-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  text-align: center;
  color: #999;
  font-size: 13px;
}

.footer-inner p {
  margin: 4px 0;
}
</style>
