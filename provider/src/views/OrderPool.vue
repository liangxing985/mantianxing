<template>
  <div class="pool-page">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon online">🟢</div>
        <div class="stat-info">
          <div class="stat-num">{{ profile?.isOnline ? '在线' : '离线' }}</div>
          <div class="stat-label">当前状态</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orders">📦</div>
        <div class="stat-info">
          <div class="stat-num">{{ todayOrders }}</div>
          <div class="stat-label">今日订单</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon income">💰</div>
        <div class="stat-info">
          <div class="stat-num">{{ todayIncome }}</div>
          <div class="stat-label">今日收入(星石)</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon pool">🔥</div>
        <div class="stat-info">
          <div class="stat-num">{{ list.length }}</div>
          <div class="stat-label">待抢订单</div>
        </div>
      </div>
    </div>

    <!-- 离线提示 -->
    <div v-if="!profile?.isOnline" class="offline-card">
      <div class="offline-icon">😴</div>
      <h3>当前已离线</h3>
      <p>开启在线状态后即可开始抢单</p>
      <button class="btn btn-primary btn-lg" @click="toggleOnlineStatus(true)">开始接单</button>
    </div>

    <!-- 订单列表 -->
    <template v-else>
      <div class="section-header">
        <h2 class="section-title">抢单大厅</h2>
        <button class="btn btn-outline btn-sm" @click="refresh">🔄 刷新</button>
      </div>

      <div class="order-grid">
        <div v-for="order in list" :key="order.id" class="order-card" @click="goDetail(order)">
          <div class="order-header">
            <span class="game-tag">
              <span class="game-icon">🎮</span>
              {{ order.serviceItem?.game?.name }}
            </span>
            <div class="amount">
              <span class="amount-num">{{ order.totalAmount }}</span>
              <span class="amount-unit">星石</span>
            </div>
          </div>
          
          <div class="order-body">
            <div class="service-name">{{ order.serviceItem?.name }}</div>
            <div class="order-meta">
              <span class="meta-item">⏱ {{ order.duration }}{{ unitText(order.unit) }}</span>
              <span class="meta-item">👤 {{ order.customer?.nickname }}</span>
            </div>
            <div class="requirement" v-if="order.requirement">
              <span class="req-label">要求:</span> {{ order.requirement }}
            </div>
          </div>
          
          <div class="order-footer">
            <span class="order-time">{{ formatTime(order.createdAt) }}</span>
            <button 
              class="btn btn-primary btn-sm" 
              :class="{ loading: grabbingId === order.id }"
              @click.stop="handleGrab(order)"
              :disabled="grabbingId === order.id"
            >
              {{ grabbingId === order.id ? '抢单中...' : '立即抢单' }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="list.length === 0" class="empty-state">
        <div class="empty-icon">📭</div>
        <p>暂无可抢订单</p>
        <p class="empty-tip">点击刷新试试</p>
      </div>
      
      <div v-if="!finished && list.length > 0" class="load-more">
        <button class="btn btn-outline" @click="loadData" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getOrderPool, grabOrder, getMyProfile, toggleOnline, getMyOrders } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const grabbingId = ref<number | null>(null)
const profile = ref<any>(null)
const todayOrders = ref(0)
const todayIncome = ref(0)

const loadProfile = async () => {
  const res: any = await getMyProfile()
  profile.value = res?.providerProfile || res || {}
}

const loadStats = async () => {
  try {
    const today = dayjs().format('YYYY-MM-DD')
    const res: any = await getMyOrders({ page: 1, pageSize: 100 })
    const orders = res?.list || []
    const todayList = orders.filter((o: any) => dayjs(o.createdAt).format('YYYY-MM-DD') === today)
    todayOrders.value = todayList.length
    todayIncome.value = todayList.reduce((sum: number, o: any) => sum + (o.providerIncome || 0), 0)
  } catch (e) {}
}

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await getOrderPool({ page: page.value, pageSize: 20 })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total
    page.value++
  } finally {
    loading.value = false
  }
}

const refresh = () => {
  page.value = 1
  list.value = []
  finished.value = false
  loadData()
  loadStats()
}

const toggleOnlineStatus = async (val: boolean) => {
  if (!profile.value) return
  profile.value.isOnline = val
  try {
    await toggleOnline(val)
    if (val) refresh()
    showToast(val ? '已开始接单' : '已关闭接单')
  } catch {
    profile.value.isOnline = !val
    showToast('操作失败，请重试')
  }
}

const handleGrab = async (order: any) => {
  grabbingId.value = order.id
  try {
    await grabOrder(order.id)
    showSuccessToast('抢单成功！')
    list.value = list.value.filter((o: any) => o.id !== order.id)
    setTimeout(() => router.push(`/order/${order.id}`), 800)
  } catch (e: any) {
    list.value = list.value.filter((o: any) => o.id !== order.id)
    showToast(e?.message || '手慢了，订单已被抢走')
  } finally {
    grabbingId.value = null
  }
}

const goDetail = (order: any) => router.push(`/order/${order.id}`)

const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')

onMounted(() => { 
  loadProfile()
  loadStats()
  loadData() 
})
</script>

<style scoped>
.pool-page { padding: 0; }

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.stat-icon.online { background: #e6f7f0; }
.stat-icon.orders { background: #e6f4ff; }
.stat-icon.income { background: #fff7e6; }
.stat-icon.pool { background: #fff1f0; }

.stat-num {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 2px;
}

/* 离线提示 */
.offline-card {
  background: #fff;
  border-radius: var(--radius-lg);
  padding: 60px;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.offline-icon { font-size: 72px; margin-bottom: 20px; }
.offline-card h3 { font-size: 24px; margin-bottom: 8px; color: var(--text-primary); }
.offline-card p { font-size: 15px; color: var(--text-secondary); margin-bottom: 24px; }

/* 区块标题 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

/* 订单网格 */
.order-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.order-card {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all 0.2s;
}

.order-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.game-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f0edff;
  color: var(--secondary);
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
}

.amount {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.amount-num {
  font-size: 26px;
  font-weight: 700;
  color: var(--danger);
}

.amount-unit {
  font-size: 12px;
  color: var(--text-muted);
}

.order-body { margin-bottom: 14px; }

.service-name {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.order-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.meta-item {
  font-size: 13px;
  color: var(--text-secondary);
}

.requirement {
  font-size: 13px;
  color: var(--text-secondary);
  background: #f8f9fa;
  padding: 10px 12px;
  border-radius: 8px;
  line-height: 1.5;
}

.req-label { color: var(--text-muted); }

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 14px;
  border-top: 1px solid var(--border-color);
}

.order-time {
  font-size: 12px;
  color: var(--text-muted);
}

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon { font-size: 56px; margin-bottom: 12px; }
.empty-state p { font-size: 15px; color: var(--text-secondary); margin-bottom: 4px; }
.empty-tip { font-size: 13px !important; color: var(--text-muted) !important; }

.load-more {
  text-align: center;
  padding: 24px;
}
</style>
