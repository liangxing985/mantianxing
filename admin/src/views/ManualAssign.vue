<template>
  <div class="manual-assign">
    <div class="page-header">
      <h2>客服派单中心</h2>
      <div class="stats">
        <span class="stat-item">待派单：{{ poolOrders.length }}</span>
      </div>
    </div>

    <div v-if="poolOrders.length === 0" class="empty">暂无待派单订单</div>

    <div v-for="group in groupedOrders" :key="group.key" class="order-card">
      <div class="order-header">
        <span class="order-no">{{ group.orders[0].orderNo }}</span>
        <span v-if="group.isDouble" class="tag tag-double">双陪订单 ({{ group.orders.length }}单)</span>
        <span v-else class="tag tag-single">单陪订单</span>
        <span class="status">待派单</span>
      </div>

      <div class="order-info">
        <div><span>游戏：</span>{{ group.orders[0].serviceItem?.game?.name }}</div>
        <div><span>服务：</span>{{ group.orders[0].serviceItem?.name }}</div>
        <div><span>老板：</span>{{ group.orders[0].customer?.nickname }}</div>
        <div><span>时长：</span>{{ group.orders[0].duration }}{{ group.orders[0].serviceItem?.unit === 'hour' ? '小时' : '局' }}</div>
        <div><span>总金额：</span>{{ groupTotal(group) }}星石</div>
        <div v-if="group.orders[0].requirement"><span>要求：</span>{{ group.orders[0].requirement }}</div>
      </div>

      <div class="assign-area">
        <div class="provider-selects">
          <div v-for="(_, idx) in group.orders" :key="idx" class="select-row">
            <label>陪玩{{ idx + 1 }}：</label>
            <select v-model="assignMap[group.key][idx]" class="provider-select">
              <option value="">选择陪玩</option>
              <option v-for="p in providers" :key="p.id" :value="p.id">
                {{ p.nickname }} ({{ p.providerProfile?.level }}级 / {{ p.providerProfile?.rating?.toFixed(1) }}分 / {{ p.providerProfile?.isOnline ? '在线' : '离线' }})
              </option>
            </select>
          </div>
        </div>
        <div class="btn-group">
          <button class="btn btn-primary" @click="doAssign(group)" :disabled="!canAssign(group)">手动派单</button>
          <button class="btn btn-auto" @click="doAutoAssign(group)">🤖 自动派单</button>
        </div>
      </div>
    </div>

    <!-- 转派弹窗 -->
    <div v-if="showReassign" class="modal-mask" @click.self="showReassign = false">
      <div class="modal">
        <h3>转派订单</h3>
        <div class="form-item">
          <label>原陪玩：</label>
          <span>{{ reassignOrder?.provider?.nickname }}</span>
        </div>
        <div class="form-item">
          <label>新陪玩：</label>
          <select v-model="reassignNewProvider" class="provider-select">
            <option value="">选择新陪玩</option>
            <option v-for="p in providers" :key="p.id" :value="p.id">{{ p.nickname }}</option>
          </select>
        </div>
        <div class="form-item">
          <label>转派原因：</label>
          <textarea v-model="reassignReason" class="reason-input" placeholder="请输入转派原因"></textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-cancel" @click="showReassign = false">取消</button>
          <button class="btn btn-primary" @click="doReassign" :disabled="!reassignNewProvider">确认转派</button>
        </div>
      </div>
    </div>

    <!-- 派单记录弹窗 -->
    <div v-if="showRecords" class="modal-mask" @click.self="showRecords = false">
      <div class="modal modal-wide">
        <h3>派单记录</h3>
        <div v-if="dispatchRecords.length === 0" class="empty">暂无派单记录</div>
        <div v-else class="record-list">
          <div v-for="r in dispatchRecords" :key="r.id" class="record-item">
            <div class="record-type" :class="r.type">{{ typeText(r.type) }}</div>
            <div class="record-detail">
              <div v-if="r.fromProvider">从 {{ r.fromProvider.nickname }} → {{ r.toProvider?.nickname }}</div>
              <div v-else>派给 {{ r.toProvider?.nickname }}</div>
              <div class="record-meta">
                <span>操作人：{{ r.operator?.nickname || '系统' }}</span>
                <span>{{ formatTime(r.createdAt) }}</span>
              </div>
              <div v-if="r.reason" class="record-reason">原因：{{ r.reason }}</div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-cancel" @click="showRecords = false">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const poolOrders = ref<any[]>([])
const providers = ref<any[]>([])
const assignMap = reactive<Record<string, (number | string)[]>>({})

const showReassign = ref(false)
const reassignOrder = ref<any>(null)
const reassignNewProvider = ref<number | ''>('')
const reassignReason = ref('')

const showRecords = ref(false)
const dispatchRecords = ref<any[]>([])

// 按orderGroup分组订单
const groupedOrders = computed(() => {
  const groups: Record<string, any[]> = {}
  for (const o of poolOrders.value) {
    const key = o.orderGroup || `single_${o.id}`
    if (!groups[key]) groups[key] = []
    groups[key].push(o)
  }
  return Object.entries(groups).map(([key, orders]) => ({
    key,
    orders,
    isDouble: orders.length > 1,
  }))
})

onMounted(async () => {
  await loadData()
})

async function loadData() {
  const [poolRes, userRes] = await Promise.all([
    request.get('/admin/pool-orders'),
    request.get('/admin/users', { params: { role: 'PROVIDER', pageSize: 200 } }),
  ])
  poolOrders.value = poolRes as any
  providers.value = (userRes as any)?.list || []
  // 初始化assignMap
  for (const group of groupedOrders.value) {
    if (!assignMap[group.key]) {
      assignMap[group.key] = group.orders.map(() => '')
    }
  }
}

function groupTotal(group: any) {
  return group.orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0)
}

function canAssign(group: any) {
  return assignMap[group.key]?.every((v: any) => v)
}

async function doAssign(group: any) {
  const providerIds = assignMap[group.key].map(Number)
  try {
    await request.post(`/admin/orders/${group.orders[0].id}/assign`, { providerIds })
    ElMessage.success('派单成功')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '派单失败')
  }
}

async function doAutoAssign(group: any) {
  try {
    const res: any = await request.post(`/admin/orders/${group.orders[0].id}/auto-assign`)
    ElMessage.success(`自动派单成功：${res.providerName}（权重得分${res.score?.toFixed(1)}）`)
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '自动派单失败')
  }
}

async function openReassign(order: any) {
  reassignOrder.value = order
  reassignNewProvider.value = ''
  reassignReason.value = ''
  showReassign.value = true
}

async function doReassign() {
  if (!reassignNewProvider.value || !reassignOrder.value) return
  try {
    await request.post(`/admin/orders/${reassignOrder.value.id}/reassign`, {
      newProviderId: reassignNewProvider.value,
      reason: reassignReason.value,
    })
    ElMessage.success('转派成功')
    showReassign.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '转派失败')
  }
}

async function viewRecords(order: any) {
  try {
    const res: any = await request.get(`/admin/orders/${order.id}/dispatch-records`)
    dispatchRecords.value = res || []
    showRecords.value = true
  } catch (e: any) {
    ElMessage.error('获取派单记录失败')
  }
}

function typeText(type: string) {
  const map: Record<string, string> = {
    DISPATCH: '手动派单',
    AUTO: '自动派单',
    REDISPATCH: '转派',
    GRAB: '抢单',
  }
  return map[type] || type
}

function formatTime(t: string) {
  const d = new Date(t)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped>
.manual-assign { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.page-header h2 { margin: 0; }
.stats { color: #666; font-size: 14px; }
.stat-item { background: #e6f4ff; color: #1677ff; padding: 4px 12px; border-radius: 12px; }
.empty { text-align: center; color: #999; padding: 60px 0; }
.order-card { background: #fff; border-radius: 10px; padding: 16px; margin-bottom: 12px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.order-header { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.order-no { font-weight: 600; font-size: 14px; }
.tag { padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.tag-double { background: #fff7e6; color: #fa8c16; }
.tag-single { background: #f6ffed; color: #52c41a; }
.status { margin-left: auto; background: #faad14; color: #fff; padding: 2px 10px; border-radius: 10px; font-size: 12px; }
.order-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; font-size: 13px; color: #666; margin-bottom: 12px; }
.order-info span { color: #999; }
.assign-area { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; }
.provider-selects { flex: 1; }
.select-row { display: flex; align-items: center; margin-bottom: 8px; }
.select-row label { width: 60px; font-size: 13px; color: #666; }
.provider-select { flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; }
.btn-group { display: flex; gap: 8px; }
.btn { padding: 8px 20px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; }
.btn-primary { background: #1677ff; color: #fff; }
.btn-primary:disabled { background: #ccc; cursor: not-allowed; }
.btn-auto { background: #722ed1; color: #fff; }
.btn-cancel { background: #f0f0f0; color: #333; }
.modal-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal { background: #fff; border-radius: 10px; padding: 24px; width: 420px; max-width: 90vw; }
.modal-wide { width: 560px; }
.modal h3 { margin: 0 0 16px; }
.form-item { margin-bottom: 14px; }
.form-item label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
.reason-input { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; min-height: 60px; resize: vertical; }
.modal-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.record-list { max-height: 400px; overflow-y: auto; }
.record-item { display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0; }
.record-type { padding: 4px 10px; border-radius: 6px; font-size: 12px; height: fit-content; white-space: nowrap; }
.record-type.DISPATCH { background: #e6f4ff; color: #1677ff; }
.record-type.AUTO { background: #f9f0ff; color: #722ed1; }
.record-type.REDISPATCH { background: #fff7e6; color: #fa8c16; }
.record-type.GRAB { background: #f6ffed; color: #52c41a; }
.record-detail { flex: 1; font-size: 13px; }
.record-meta { color: #999; font-size: 12px; margin-top: 4px; display: flex; gap: 12px; }
.record-reason { color: #666; margin-top: 4px; }
</style>
