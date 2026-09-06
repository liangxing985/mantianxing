<template>
  <div>
    <van-tabs v-model:active="activeTab" @change="onTabChange">
      <van-tab title="全部" name="" />
      <van-tab title="待开始" name="ASSIGNED" />
      <van-tab title="服务中" name="SERVING" />
      <van-tab title="已完成" name="COMPLETED" />
    </van-tabs>
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData">
      <div v-for="order in list" :key="order.id" class="order-card" @click="$router.push(`/order/${order.id}`)">
        <div class="order-header">
          <span class="game">{{ order.serviceItem?.game?.name }} / {{ order.serviceItem?.name }}</span>
          <van-tag :type="statusType(order.status) as any">{{ statusText(order.status) }}</van-tag>
        </div>
        <div class="order-body">
          <div>老板: {{ order.customer?.nickname }}</div>
          <div class="meta">{{ order.duration }}{{ unitText(order.unit) }} · {{ order.totalAmount }}星石</div>
        </div>
        <div class="order-footer">
          <span>{{ formatTime(order.createdAt) }}</span>
          <van-button v-if="order.status === 'ASSIGNED'" size="small" type="primary" @click.stop="goDetail(order)">开始服务</van-button>
          <van-button v-if="order.status === 'SERVING'" size="small" type="warning" @click.stop="goDetail(order)">提交报单</van-button>
        </div>
      </div>
    </van-list>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getMyOrders } from '@/api'
import dayjs from 'dayjs'
const router = useRouter()
const list = ref<any[]>([]); const loading = ref(false); const finished = ref(false)
const page = ref(1); const activeTab = ref('')
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getMyOrders({ page: page.value, pageSize: 20, status: activeTab.value })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total; page.value++
  } finally { loading.value = false }
}
const onTabChange = () => { page.value = 1; list.value = []; finished.value = false; loadData() }
const goDetail = (order: any) => router.push(`/order/${order.id}`)
const statusText = (s: string) => ({ ASSIGNED: '待开始', SERVING: '服务中', REVIEWING: '待审核', COMPLETED: '已完成', CANCELLED: '已取消' }[s] || s)
const statusType = (s: string) => ({ ASSIGNED: 'primary', SERVING: 'warning', REVIEWING: '', COMPLETED: 'success', CANCELLED: 'danger' }[s] || 'default')
const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')
onMounted(loadData)
</script>
<style scoped>
.order-card { background: #fff; margin: 10px 12px; border-radius: 12px; padding: 14px; }
.order-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.game { font-size: 14px; font-weight: 600; }
.meta { font-size: 12px; color: #999; margin-top: 4px; }
.order-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; padding-top: 10px; border-top: 1px solid #f5f5f5; font-size: 12px; color: #999; }
</style>
