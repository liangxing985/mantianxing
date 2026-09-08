<template>
  <div>
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="全部" name="" />
      <van-tab title="待接单" name="PAID" />
      <van-tab title="进行中" name="ASSIGNED,SERVING" />
      <van-tab title="待评价" name="COMPLETED" />
    </van-tabs>

    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData">
      <div v-for="order in list" :key="order.id" class="order-card" @click="$router.push(`/order/${order.id}`)">
        <div class="order-header">
          <span class="order-no">{{ order.orderNo }}</span>
          <van-tag :type="statusType(order.status) as any">{{ statusText(order.status) }}</van-tag>
        </div>
        <div class="order-body">
          <van-image round width="48" height="48" :src="order.provider?.avatar || defaultAvatar" />
          <div class="info">
            <div class="name">{{ order.provider?.nickname || '等待接单中...' }}</div>
            <div class="service">{{ order.serviceItem?.game?.name }} / {{ order.serviceItem?.name }}</div>
            <div class="meta">{{ order.duration }}{{ unitText(order.unit) }} · {{ order.totalAmount }}星石</div>
          </div>
        </div>
        <div class="order-footer">
          <span class="time">{{ formatTime(order.createdAt) }}</span>
          <div class="actions">
            <van-button v-if="order.status === 'PAID'" size="small" plain type="danger" @click.stop="cancelOrder(order)">取消订单</van-button>
            <van-button v-if="order.status === 'COMPLETED' && !order.customerRating" size="small" type="primary" @click.stop="goReview(order)">去评价</van-button>
          </div>
        </div>
      </div>
    </van-list>
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
  loading.value = true
  try {
    const res: any = await getMyOrders({ page: page.value, pageSize: 20, status: activeTab.value })
    let orders = res.list || []
    // 待评价标签页：过滤掉已评价的订单
    if (activeTab.value === 'COMPLETED') {
      orders = orders.filter((o: any) => !o.customerRating)
    }
    list.value = page.value === 1 ? orders : [...list.value, ...orders]
    finished.value = list.value.length >= res.total
    page.value++
  } finally {
    loading.value = false
  }
}

const onTabChange = () => {
  page.value = 1; list.value = []; finished.value = false; loadData()
}

const cancelOrder = async (order: any) => {
  await showConfirmDialog({ title: '取消订单', message: '确定取消该订单吗？星石将原路退回' })
  await cancelOrderApi(order.id)
  showToast('已取消')
  onTabChange()
}

const goReview = (order: any) => {
  // 跳转到订单详情页进行评价
  window.location.href = `/order/${order.id}?review=1`
}

const statusText = (s: string) => ({
  CREATED: '待支付', PAID: '待接单', ASSIGNED: '已接单', SERVING: '服务中',
  REVIEWING: '待审核', COMPLETED: '已完成', CANCELLED: '已取消', EXPIRED: '已过期',
}[s] || s)
const statusType = (s: string) => ({
  CREATED: 'warning', PAID: 'primary', ASSIGNED: '', SERVING: 'success',
  REVIEWING: 'warning', COMPLETED: 'success', CANCELLED: 'danger', EXPIRED: 'default',
}[s] || 'default')
const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')

onMounted(loadData)
</script>

<style scoped>
.order-card {
  background: #fff;
  margin: 10px 12px;
  border-radius: 12px;
  padding: 14px;
}
.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.order-no { font-size: 12px; color: #999; }
.order-body { display: flex; align-items: center; }
.info { margin-left: 12px; flex: 1; }
.name { font-size: 15px; font-weight: 600; }
.service { font-size: 13px; color: #666; margin: 2px 0; }
.meta { font-size: 12px; color: #999; }
.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #f5f5f5;
}
.time { font-size: 12px; color: #999; }
</style>
