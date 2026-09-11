<template>
  <div class="orders-page">
    <div class="page-header">
      <h1 class="page-title">我的订单</h1>
      <p class="page-subtitle">查看和管理你的所有订单</p>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-tabs">
      <span 
        class="filter-tab" 
        :class="{ active: activeTab === '' }" 
        @click="selectTab('')"
      >全部</span>
      <span 
        class="filter-tab" 
        :class="{ active: activeTab === 'PAID' }" 
        @click="selectTab('PAID')"
      >待接单</span>
      <span 
        class="filter-tab" 
        :class="{ active: activeTab === 'ASSIGNED,SERVING' }" 
        @click="selectTab('ASSIGNED,SERVING')"
      >进行中</span>
      <span 
        class="filter-tab" 
        :class="{ active: activeTab === 'COMPLETED' }" 
        @click="selectTab('COMPLETED')"
      >待评价</span>
    </div>

    <!-- 订单列表 -->
    <div class="order-list">
      <div v-for="order in list" :key="order.id" class="order-card" @click="$router.push(`/order/${order.id}`)">
        <div class="order-header">
          <span class="order-no">订单号: {{ order.orderNo }}</span>
          <span class="order-status" :class="statusClass(order.status)">{{ statusText(order.status) }}</span>
        </div>
        <div class="order-body">
          <img :src="order.provider?.avatar || defaultAvatar" class="provider-avatar" />
          <div class="order-info">
            <div class="provider-name">{{ order.provider?.nickname || '等待接单中...' }}</div>
            <div class="service-info">{{ order.serviceItem?.game?.name }} / {{ order.serviceItem?.name }}</div>
            <div class="order-meta">{{ order.duration }}{{ unitText(order.unit) }} · {{ order.totalAmount }}星石</div>
          </div>
          <div class="order-amount">
            <span class="amount-num">{{ order.totalAmount }}</span>
            <span class="amount-unit">星石</span>
          </div>
        </div>
        <div class="order-footer">
          <span class="order-time">{{ formatTime(order.createdAt) }}</span>
          <div class="order-actions">
            <button v-if="order.status === 'PAID'" class="btn-cancel" @click.stop="cancelOrder(order)">取消订单</button>
            <button v-if="order.status === 'COMPLETED' && !order.customerRating" class="btn-review" @click.stop="goReview(order)">去评价</button>
            <button class="btn-detail" @click.stop="$router.push(`/order/${order.id}`)">查看详情</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="finished && list.length > 0" class="finished">没有更多了</div>
    <div v-else-if="list.length === 0" class="empty">
      <div class="empty-icon">📋</div>
      <p>暂无订单</p>
      <button class="btn-go" @click="$router.push('/providers')">去找陪玩</button>
    </div>
    
    <div v-if="!finished && list.length > 0" class="load-more">
      <button class="load-more-btn" @click="loadData" :disabled="loading">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { getMyOrders, cancelOrder as cancelOrderApi } from '@/api'
import dayjs from 'dayjs'

const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const activeTab = ref('')
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await getMyOrders({ page: page.value, pageSize: 10, status: activeTab.value })
    const data = res?.data || res || {}
    let orders = data.list || data.items || []
    if (activeTab.value === 'COMPLETED') {
      orders = orders.filter((o: any) => !o.customerRating)
    }
    list.value = page.value === 1 ? orders : [...list.value, ...orders]
    const total = data.total ?? orders.length
    finished.value = list.value.length >= total || orders.length === 0
    page.value++
  } catch (e) {
    finished.value = true
  } finally {
    loading.value = false
  }
}

const selectTab = (tab: string) => {
  activeTab.value = tab
  page.value = 1
  list.value = []
  finished.value = false
  loadData()
}

const cancelOrder = async (order: any) => {
  await showConfirmDialog({ title: '取消订单', message: '确定取消该订单吗？星石将原路退回' })
  await cancelOrderApi(order.id)
  showToast('已取消')
  selectTab(activeTab.value)
}

const goReview = (order: any) => {
  window.location.href = `/order/${order.id}?review=1`
}

const statusText = (s: string) => ({
  CREATED: '待支付', PAID: '待接单', ASSIGNED: '已接单', SERVING: '服务中',
  REVIEWING: '待审核', COMPLETED: '已完成', CANCELLED: '已取消', EXPIRED: '已过期',
}[s] || s)

const statusClass = (s: string) => ({
  CREATED: 'status-warning', PAID: 'status-primary', ASSIGNED: 'status-info', SERVING: 'status-success',
  REVIEWING: 'status-warning', COMPLETED: 'status-success', CANCELLED: 'status-danger', EXPIRED: 'status-default',
}[s] || 'status-default')

const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

onMounted(loadData)
</script>

<style scoped>
.orders-page {
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

/* 筛选标签 */
.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  background: #fff;
  padding: 12px 16px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.filter-tab {
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.filter-tab:hover {
  background: #f5f5f5;
}

.filter-tab.active {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
}

/* 订单列表 */
.order-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.1);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.order-no {
  font-size: 13px;
  color: #999;
}

.order-status {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}

.status-warning { background: #fff7e6; color: #fa8c16; }
.status-primary { background: #e6f7ff; color: #1890ff; }
.status-info { background: #f0f5ff; color: #2f54eb; }
.status-success { background: #f6ffed; color: #52c41a; }
.status-danger { background: #fff1f0; color: #f5222d; }
.status-default { background: #f5f5f5; color: #999; }

.order-body {
  display: flex;
  align-items: center;
  gap: 16px;
}

.provider-avatar {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  object-fit: cover;
}

.order-info {
  flex: 1;
}

.provider-name {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.service-info {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

.order-meta {
  font-size: 13px;
  color: #999;
}

.order-amount {
  text-align: right;
}

.amount-num {
  font-size: 28px;
  font-weight: 700;
  color: #f5222d;
}

.amount-unit {
  font-size: 14px;
  color: #999;
  margin-left: 4px;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.order-time {
  font-size: 13px;
  color: #999;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.btn-cancel {
  background: #fff;
  color: #f5222d;
  border: 1px solid #f5222d;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #fff1f0;
}

.btn-review {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-review:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108,92,231,0.4);
}

.btn-detail {
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-detail:hover {
  background: #e8e8e8;
}

/* 加载状态 */
.loading, .finished {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.empty {
  text-align: center;
  padding: 80px 20px;
  color: #999;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty p {
  font-size: 16px;
  margin-bottom: 24px;
}

.btn-go {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-go:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(108,92,231,0.4);
}

.load-more {
  text-align: center;
  margin-top: 24px;
}

.load-more-btn {
  background: #fff;
  color: #6c5ce7;
  border: 1px solid #6c5ce7;
  padding: 10px 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #f5f3ff;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
