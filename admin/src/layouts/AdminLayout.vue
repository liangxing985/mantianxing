<template>
  <el-container class="admin-layout">
    <el-aside :width="collapsed ? '72px' : '240px'" class="sidebar" :class="{ collapsed }">
      <div class="logo">
        <div class="logo-icon">★</div>
        <div v-if="!collapsed" class="logo-text">
          <div class="logo-title">漫天星电竞</div>
          <div class="logo-sub">运营管理后台</div>
        </div>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="collapsed"
        :collapse-transition="false"
        class="sidebar-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <template #title>数据概览</template>
        </el-menu-item>

        <el-sub-menu index="user">
          <template #title>
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </template>
          <el-menu-item index="/users">用户列表</el-menu-item>
          <el-menu-item index="/providers">陪玩管理</el-menu-item>
          <el-menu-item index="/provider-apply">陪玩审核</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="content">
          <template #title>
            <el-icon><Goods /></el-icon>
            <span>内容运营</span>
          </template>
          <el-menu-item index="/products">商品管理</el-menu-item>
          <el-menu-item index="/activities">活动管理</el-menu-item>
          <el-menu-item index="/games">游戏管理</el-menu-item>
          <el-menu-item index="/game-approvals">游戏审核</el-menu-item>
          <el-menu-item index="/pricing">定价管理</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="order">
          <template #title>
            <el-icon><Document /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="/orders">订单列表</el-menu-item>
          <el-menu-item index="/order-review">报单审核</el-menu-item>
        </el-sub-menu>

        <el-menu-item index="/withdraw">
          <el-icon><Money /></el-icon>
          <template #title>提现审核</template>
        </el-menu-item>

        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>系统设置</template>
        </el-menu-item>
      </el-menu>
      <div class="sidebar-footer" v-if="!collapsed">
        <div class="version">v1.0.0</div>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="collapsed = !collapsed">
            <Fold v-if="!collapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="header-stats">
            <span class="stat-item">
              <span class="stat-dot online"></span>
              系统正常
            </span>
          </div>
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              <el-avatar :size="36" :src="user?.avatar" class="user-avatar">
                {{ user?.nickname?.charAt(0) || 'A' }}
              </el-avatar>
              <div class="user-detail">
                <span class="username">{{ user?.nickname || '管理员' }}</span>
                <span class="user-role">{{ roleText }}</span>
              </div>
              <el-icon class="arrow-icon"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>

    <!-- 个人资料弹窗 -->
    <el-dialog v-model="showProfile" title="个人资料" width="420px">
      <div class="profile-dialog">
        <div class="avatar-upload-section">
          <div class="avatar-upload" @click="triggerAvatarUpload">
            <el-avatar :size="80" :src="profileForm.avatar" class="avatar-preview">
              {{ profileForm.nickname?.charAt(0) || 'A' }}
            </el-avatar>
            <div class="avatar-overlay">点击更换</div>
            <input ref="avatarInput" type="file" accept="image/*" style="display:none" @change="handleAvatarUpload" />
          </div>
        </div>
        <el-form label-width="80px">
          <el-form-item label="昵称">
            <el-input v-model="profileForm.nickname" placeholder="请输入昵称" />
          </el-form-item>
          <el-form-item label="用户名">
            <el-input v-model="profileForm.username" disabled />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showProfile = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Fold, Expand, ArrowDown, DataAnalysis, User, UserFilled, Avatar, Goods, Promotion, Document, Checked, Money, Box, Setting } from '@element-plus/icons-vue'
import { getProfile, updateProfile } from '@/api'

const route = useRoute()
const router = useRouter()
const collapsed = ref(false)
const showProfile = ref(false)
const avatarInput = ref<HTMLInputElement | null>(null)
const profileForm = reactive({ nickname: '', username: '', avatar: '' })

const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')
const user = computed(() => JSON.parse(localStorage.getItem('admin_user') || '{}'))
const roleText = computed(() => {
  const role = user.value?.role
  return role === 'ADMIN' ? '超级管理员' : role === 'OPERATOR' ? '运营客服' : role
})

const handleCommand = async (command: string) => {
  if (command === 'logout') {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', {
      type: 'warning',
      confirmButtonText: '确定',
      cancelButtonText: '取消',
    }).then(() => {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    try {
      const res: any = await getProfile()
      profileForm.nickname = res.nickname || ''
      profileForm.username = res.username || ''
      profileForm.avatar = res.avatar || ''
    } catch (e) {}
    showProfile.value = true
  }
}

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const handleAvatarUpload = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过5MB')
    return
  }
  try {
    const formData = new FormData()
    formData.append('file', file)
    const token = localStorage.getItem('admin_token')
    const res = await fetch('/api/upload/image', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    })
    const data = await res.json()
    if (data?.data?.url) {
      profileForm.avatar = data.data.url
      ElMessage.success('头像上传成功')
    } else {
      ElMessage.error('上传失败')
    }
  } catch (err) {
    ElMessage.error('上传失败')
  } finally {
    if (target) target.value = ''
  }
}

const saveProfile = async () => {
  try {
    await updateProfile({ nickname: profileForm.nickname, avatar: profileForm.avatar })
    const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}')
    adminUser.nickname = profileForm.nickname
    adminUser.avatar = profileForm.avatar
    localStorage.setItem('admin_user', JSON.stringify(adminUser))
    ElMessage.success('保存成功')
    showProfile.value = false
  } catch (e) {
    ElMessage.error('保存失败')
  }
}
</script>

<style scoped>
.admin-layout {
  height: 100vh;
}

/* 侧边栏 */
.sidebar {
  background: linear-gradient(180deg, #1a1b2e 0%, #161829 100%);
  overflow: hidden;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.logo-icon {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #fdcb6e, #e17055);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #fff;
  flex-shrink: 0;
}

.logo-text { flex: 1; min-width: 0; }

.logo-title {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
}

.logo-sub {
  font-size: 11px;
  color: #6b6f9d;
  margin-top: 1px;
}

.sidebar-menu {
  flex: 1;
  border-right: none !important;
  background: transparent !important;
  padding: 12px 0;
}

:deep(.el-menu-item) {
  height: 48px;
  line-height: 48px;
  margin: 2px 12px;
  border-radius: 8px;
  color: #a0a3c4 !important;
  font-size: 14px;
}

:deep(.el-menu-item:hover) {
  background: rgba(255,255,255,0.06) !important;
  color: #fff !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(108,92,231,0.3), rgba(162,155,254,0.2)) !important;
  color: #fff !important;
  font-weight: 500;
}

:deep(.el-menu-item .el-icon) {
  font-size: 18px;
}

:deep(.el-sub-menu__title) {
  height: 48px;
  line-height: 48px;
  margin: 2px 12px;
  border-radius: 8px;
  color: #a0a3c4 !important;
  font-size: 14px;
}

:deep(.el-sub-menu__title:hover) {
  background: rgba(255,255,255,0.06) !important;
  color: #fff !important;
}

:deep(.el-sub-menu.is-active > .el-sub-menu__title) {
  color: #fff !important;
}

:deep(.el-menu--inline .el-menu-item) {
  min-width: auto !important;
  padding-left: 52px !important;
  height: 42px;
  line-height: 42px;
  margin: 1px 12px;
  font-size: 13px;
}

:deep(.el-sub-menu .el-menu--inline) {
  background: transparent !important;
}

.sidebar-footer {
  padding: 16px 20px;
  border-top: 1px solid rgba(255,255,255,0.06);
}

.version {
  font-size: 12px;
  color: #4a4d6e;
  text-align: center;
}

/* 顶部栏 */
.header {
  background: #fff;
  border-bottom: 1px solid #eef0f4;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 28px;
  height: 64px !important;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
  padding: 6px;
  border-radius: 6px;
  transition: all 0.2s;
}

.collapse-btn:hover {
  color: #6c5ce7;
  background: #f5f3ff;
}

:deep(.el-breadcrumb__inner) {
  font-size: 14px;
  color: #909399;
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: #303133;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #606266;
}

.stat-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.stat-dot.online {
  background: #67c23a;
  box-shadow: 0 0 8px rgba(103,194,58,0.5);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.user-info:hover {
  background: #f5f7fa;
}

.user-avatar {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  font-weight: 600;
}

.user-detail {
  display: flex;
  flex-direction: column;
  line-height: 1.3;
}

.username {
  font-size: 14px;
  color: #303133;
  font-weight: 500;
}

.user-role {
  font-size: 11px;
  color: #909399;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 12px;
}

/* 主内容区 */
.main-content {
  background: #f5f7fa;
  padding: 24px 28px;
}

/* 页面过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(8px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* 个人资料弹窗 */
.profile-dialog {
  text-align: center;
}

.avatar-upload-section {
  margin-bottom: 20px;
}

.avatar-upload {
  position: relative;
  width: 80px;
  height: 80px;
  margin: 0 auto;
  cursor: pointer;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-preview {
  width: 100% !important;
  height: 100% !important;
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
</style>
