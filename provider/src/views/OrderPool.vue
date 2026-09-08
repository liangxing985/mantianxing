<template>
  <div class="pool-page">
    <div class="header">
      <div class="header-info">
        <span class="title">抢单大厅</span>
        <van-tag :type="profile?.isOnline ? 'success' : 'default'">
          {{ profile?.isOnline ? '在线接单中' : '已离线' }}
        </van-tag>
      </div>
      <van-switch :model-value="profile?.isOnline" @update:model-value="(v: any) => profile && (profile.isOnline = v)" @change="toggleOnlineStatus" />
    </div>

    <van-empty v-if="!profile?.isOnline" description="请先开启在线状态才能抢单" />

    <template v-else>
      <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
        <van-list v-model:loading="loading" :finished="finished" finished-text="暂无更多订单" @load="loadData">
          <div v-for="order in list" :key="order.id" class="order-card">
            <div class="order-header">
              <span class="game">{{ order.serviceItem?.game?.name }}</span>
              <span class="amount">{{ order.totalAmount }} 星石</span>
            </div>
            <div class="order-body">
              <div class="service">{{ order.serviceItem?.name }} · {{ order.duration }}{{ unitText(order.unit) }}</div>
              <div class="requirement">{{ order.requirement || '无特殊要求' }}</div>
              <div class="meta">
                <span>老板: {{ order.customer?.nickname }}</span>
                <span>{{ formatTime(order.createdAt) }}</span>
              </div>
            </div>
            <div class="order-footer">
              <van-button type="primary" round size="small" @click="handleGrab(order)" :loading="grabbingId === order.id">
                立即抢单
              </van-button>
            </div>
          </div>
        </van-list>
      </van-pull-refresh>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { getOrderPool, grabOrder, getMyProfile, toggleOnline } from '@/api'
import dayjs from 'dayjs'

const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const refreshing = ref(false)
const page = ref(1)
const grabbingId = ref<number | null>(null)
const profile = ref<any>(null)

const loadProfile = async () => {
  const res: any = await getMyProfile()
  profile.value = res?.providerProfile || res || {}
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getOrderPool({ page: page.value, pageSize: 20 })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total
    page.value++
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

const onRefresh = () => { page.value = 1; list.value = []; finished.value = false; loadData() }

const toggleOnlineStatus = async (val: boolean) => {
  if (!profile.value) return
  profile.value.isOnline = val
  try {
    await toggleOnline(val)
    if (val) { page.value = 1; list.value = []; finished.value = false; loadData() }
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
    setTimeout(() => window.location.href = `/order/${order.id}`, 1000)
  } catch (e: any) {
    // 抢单失败（已被抢）
    list.value = list.value.filter((o: any) => o.id !== order.id)
  } finally {
    grabbingId.value = null
  }
}

const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')

onMounted(() => { loadProfile(); loadData() })
</script>

<style scoped>
.pool-page { min-height: 100vh; background: #f5f6fa; }
.header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px; background: #fff;
}
.header-info { display: flex; align-items: center; gap: 8px; }
.title { font-size: 18px; font-weight: 600; }
.order-card {
  background: #fff; margin: 10px 12px; border-radius: 12px; padding: 14px;
}
.order-header { display: flex; justify-content: space-between; align-items: center; }
.game { font-size: 15px; font-weight: 600; color: #00b894; }
.amount { font-size: 18px; font-weight: 700; color: #f5576c; }
.order-body { margin: 10px 0; }
.service { font-size: 14px; color: #333; }
.requirement { font-size: 13px; color: #666; margin: 6px 0; }
.meta { display: flex; justify-content: space-between; font-size: 12px; color: #999; }
.order-footer { text-align: right; }
</style>
