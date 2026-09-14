<template>
  <div class="manual-assign">
    <h2>客服手动派单</h2>
    <div v-if="poolOrders.length === 0" class="empty">暂无待派单订单</div>
    <div v-for="o in poolOrders" :key="o.id" class="order-card">
      <div class="order-header">
        <span class="order-no">{{ o.orderNo }}</span>
        <span class="status">待派单</span>
      </div>
      <div class="order-info">
        <div><span>游戏：</span>{{ o.serviceItem?.game?.name }}</div>
        <div><span>服务：</span>{{ o.serviceItem?.name }}</div>
        <div><span>老板：</span>{{ o.customer?.nickname }}</div>
        <div><span>时长：</span>{{ o.duration }}{{ o.serviceItem?.unit === 'hour' ? '小时' : '局' }}</div>
        <div><span>金额：</span>{{ o.totalAmount }}星石</div>
        <div v-if="o.requirement"><span>要求：</span>{{ o.requirement }}</div>
      </div>
      <div class="assign-area">
        <select v-model="assignMap[o.id]" class="provider-select">
          <option value="">选择陪玩</option>
          <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.nickname }} ({{ p.providerProfile?.level }}级)</option>
        </select>
        <button class="assign-btn" @click="doAssign(o.id)" :disabled="!assignMap[o.id]">派单</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

const poolOrders = ref<any[]>([])
const providers = ref<any[]>([])
const assignMap = reactive<Record<number, number>>({})

onMounted(async () => {
  const [poolRes, userRes] = await Promise.all([
    request.get('/admin/pool-orders'),
    request.get('/admin/users', { params: { role: 'PROVIDER', pageSize: 100 } }),
  ])
  poolOrders.value = poolRes as any
  providers.value = (userRes as any)?.list || []
})

async function doAssign(orderId: number) {
  const providerId = assignMap[orderId]
  if (!providerId) return
  try {
    await request.post(`/admin/orders/${orderId}/assign`, { providerId })
    ElMessage.success('派单成功')
    poolOrders.value = poolOrders.value.filter(o => o.id !== orderId)
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '派单失败')
  }
}
</script>

<style scoped>
.manual-assign { padding: 20px; }
h2 { margin: 0 0 20px; }
.empty { text-align: center; color: #999; padding: 60px 0; }
.order-card { background: #fff; border-radius: 10px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.order-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
.order-no { font-weight: 600; font-size: 14px; }
.status { background: #faad14; color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.order-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 13px; color: #666; margin-bottom: 12px; }
.order-info span { color: #999; }
.assign-area { display: flex; gap: 10px; }
.provider-select { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.assign-btn { padding: 8px 24px; background: #1677ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.assign-btn:disabled { background: #ccc; cursor: not-allowed; }
</style>
