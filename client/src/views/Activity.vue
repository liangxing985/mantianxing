<template>
  <div class="activity-page">
    <div class="page-header">
      <h1 class="page-title">活动中心</h1>
      <p class="page-subtitle">精彩活动，限时参与</p>
    </div>

    <div v-if="loading" class="loading-wrap">
      <div class="spinner"></div>
      <span>加载中...</span>
    </div>

    <div v-else-if="list.length === 0" class="empty-wrap">
      <div class="empty-icon">🎉</div>
      <p>暂无活动</p>
    </div>

    <div v-else class="activity-list">
      <div
        v-for="item in list"
        :key="item.id"
        class="activity-card"
        @click="handleClick(item)"
      >
        <div class="activity-image">
          <img v-if="item.image" :src="item.image" :alt="item.title" />
          <div v-else class="image-placeholder">📷</div>
          <div v-if="item.isActive" class="activity-tag active">进行中</div>
          <div v-else class="activity-tag inactive">已结束</div>
        </div>
        <div class="activity-info">
          <h3 class="activity-title">{{ item.title }}</h3>
          <p v-if="item.content" class="activity-desc">{{ item.content }}</p>
          <div v-if="item.startTime || item.endTime" class="activity-time">
            <span class="time-icon">🕐</span>
            <span>
              {{ item.startTime ? formatDate(item.startTime) : '长期' }}
              <template v-if="item.endTime"> ~ {{ formatDate(item.endTime) }}</template>
            </span>
          </div>
        </div>
        <div v-if="item.linkUrl" class="activity-arrow">→</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const list = ref<any[]>([])

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const res: any = await request.get('/activity/public/list')
    const data = res?.data || res
    list.value = Array.isArray(data) ? data : (Array.isArray(data?.list) ? data.list : [])
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function formatDate(date: string) {
  if (!date) return ''
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function handleClick(item: any) {
  if (item.linkUrl) {
    window.open(item.linkUrl, '_blank')
  }
}
</script>

<style scoped>
.activity-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}
.page-header {
  text-align: center;
  margin-bottom: 32px;
}
.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px;
}
.page-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0;
}
.loading-wrap, .empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 0;
  color: #999;
  gap: 12px;
}
.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f0f0f0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-icon {
  font-size: 48px;
}
.activity-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 20px;
}
.activity-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0,0,0,0.06);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}
.activity-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.activity-image {
  position: relative;
  width: 100%;
  height: 180px;
  background: #f5f5f5;
  overflow: hidden;
}
.activity-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.image-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48px;
  color: #ccc;
}
.activity-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}
.activity-tag.active {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
}
.activity-tag.inactive {
  background: #999;
  color: #fff;
}
.activity-info {
  padding: 16px;
  flex: 1;
}
.activity-title {
  font-size: 16px;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0 0 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.activity-desc {
  font-size: 13px;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.activity-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #999;
}
.activity-arrow {
  padding: 0 16px 16px;
  display: flex;
  justify-content: flex-end;
  color: #ccc;
  font-size: 18px;
}
</style>
