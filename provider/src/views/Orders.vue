<template>
  <div class="orders-page">
    <!-- 筛选标签 -->
    <div class="filter-bar">
      <span 
        v-for="tab in tabs" 
        :key="tab.value"
        class="filter-tab" 
        :class="{ active: activeTab === tab.value }" 
        @click="selectTab(tab.value)"
      >{{ tab.label }}</span>
    </div>

    <!-- 订单表格 -->
    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>订单号</th>
            <th>游戏/服务</th>
            <th>老板</th>
            <th>时长</th>
            <th>金额</th>
            <th>状态</th>
            <th>下单时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="order in list" :key="order.id" @click="goDetail(order)">
            <td class="order-id">#{{ order.id }}</td>
            <td>
              <div class="game-name">{{ order.serviceItem?.game?.name }}</div>
              <div class="service-name">{{ order.serviceItem?.name }}</div>
            </td>
            <td>{{ order.customer?.nickname }}</td>
            <td>{{ order.duration }}{{ unitText(order.serviceItem?.unit) }}</td>
            <td class="amount">{{ order.totalAmount }} 星石</td>
            <td><span class="tag" :class="statusClass(order.status)">{{ statusText(order.status) }}</span></td>
            <td class="time">{{ formatTime(order.createdAt) }}</td>
            <td @click.stop>
              <button v-if="order.status === 'PAID'" class="btn btn-primary btn-sm" @click="acceptOrder(order)">接单</button>
              <button v-else class="btn btn-outline btn-sm" @click="goDetail(order)">详情</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="list.length === 0" class="empty-state">
        <div class="empty-icon">📋</div>
        <p>暂无订单</p>
      </div>
      
      <div v-if="!finished && list.length > 0" class="load-more">
        <button class="btn btn-outline" @click="loadData" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getMyOrders, grabOrder } from '@/api'
import dayjs from 'dayjs'

const router = useRouter()
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const activeTab = ref('')

const tabs = [
  { label: '全部', value: '' },
  { label: '待接单', value: 'PAID' },
  { label: '待开始', value: 'ASSIGNED' },
  { label: '服务中', value: 'SERVING' },
  { label: '已完成', value: 'COMPLETED' },
]

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await getMyOrders({ page: page.value, pageSize: 20, status: activeTab.value })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total
    page.value++
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

const goDetail = (order: any) => router.push(`/order/${order.id}`)

const acceptOrder = async (order: any) => {
  await showConfirmDialog({ title: '确认接单', message: '确定接受该订单吗？' })
  await grabOrder(order.id)
  showToast('接单成功')
  selectTab(activeTab.value)
}

const statusText = (s: string) => ({
  PAID: '待接单', ASSIGNED: '待开始', SERVING: '服务中', 
  REVIEWING: '待审核', COMPLETED: '已完成', CANCELLED: '已取消'
}[s] || s)

const statusClass = (s: string) => ({
  PAID: 'tag-warning', ASSIGNED: 'tag-primary', SERVING: 'tag-success',
  REVIEWING: 'tag-warning', COMPLETED: 'tag-success', CANCELLED: 'tag-default'
}[s] || 'tag-default')

const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

onMounted(loadData)
</script>

<style scoped>
.orders-page { padding: 0; }

.filter-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-tab {
  padding: 8px 20px;
  background: #fff;
  border: 1px solid var(--border-color);
  border-radius: 20px;
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.filter-tab:hover { border-color: var(--primary); color: var(--primary); }

.filter-tab.active {
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: #fff;
  border-color: transparent;
}

.card { padding: 0; overflow: hidden; }

.order-id { font-family: monospace; color: var(--text-secondary); }
.game-name { font-weight: 600; color: var(--text-primary); }
.service-name { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
.amount { font-weight: 600; color: var(--danger); }
.time { color: var(--text-muted); font-size: 13px; }

.loading, .empty-state {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-muted);
}

.empty-icon { font-size: 56px; margin-bottom: 12px; }
.empty-state p { font-size: 15px; color: var(--text-secondary); }

.load-more {
  text-align: center;
  padding: 24px;
  border-top: 1px solid var(--border-color);
}
</style>
