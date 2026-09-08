<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '64px' : '220px'" class="sidebar" :class="{ collapsed }">
      <div class="logo">
        <span class="logo-text">{{ collapsed ? '漫' : '漫天星电竞' }}</span>
        <span v-if="!collapsed" class="logo-sub">运营管理后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="collapsed"
        :collapse-transition="false"
        background-color="#1a1b2e"
        text-color="#a0a3c4"
        active-text-color="#fff"
      >
        <el-menu-item v-for="item in menuList" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <template #title>{{ item.title }}</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <span class="page-title">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="32" :src="user?.avatar" />
              <span class="username">{{ user?.nickname || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { Fold, Expand, ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)

const menuList = [
  { path: '/dashboard', title: '数据概览', icon: 'DataAnalysis' },
  { path: '/users', title: '用户管理', icon: 'User' },
  { path: '/provider-apply', title: '陪玩审核', icon: 'Avatar' },
  { path: '/providers', title: '陪玩管理', icon: 'UserFilled' },
  { path: '/products', title: '商品管理', icon: 'Goods' },
  { path: '/activities', title: '活动管理', icon: 'Promotion' },
  { path: '/orders', title: '订单管理', icon: 'Document' },
  { path: '/order-review', title: '报单审核', icon: 'Checked' },
  { path: '/withdraw', title: '提现审核', icon: 'Money' },
  { path: '/games', title: '游戏管理', icon: 'Game' },
  { path: '/pricing', title: '定价管理', icon: 'Money' },
  { path: '/settings', title: '系统设置', icon: 'Setting' },
]

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
const user = computed(() => JSON.parse(localStorage.getItem('admin_user') || '{}'))

const handleCommand = (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
    }).then(() => {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/login')
    }).catch(() => {})
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}
.sidebar {
  background: #1a1b2e;
  overflow: hidden;
  transition: width 0.2s;
}
.sidebar.collapsed .logo {
  padding: 0;
}
.collapse-btn {
  font-size: 18px;
  cursor: pointer;
  margin-right: 12px;
  color: #606266;
}
.collapse-btn:hover {
  color: #409eff;
}
.logo {
  height: 60px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: #fff;
}
.logo-sub {
  font-size: 11px;
  color: #6b6f9d;
  margin-top: 2px;
}
:deep(.el-menu) {
  border-right: none;
}
.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
}
.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: #606266;
}
.main-content {
  background: #f5f7fa;
  padding: 20px;
}
</style>
