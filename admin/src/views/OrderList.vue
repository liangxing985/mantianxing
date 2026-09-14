<template>
  <div>
    <div class="search-bar">
      <el-input v-model="query.orderNo" placeholder="订单号" clearable style="width: 200px" @keyup.enter="loadData" />
      <el-select v-model="query.status" placeholder="订单状态" clearable style="width: 140px" @change="loadData">
        <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column label="游戏/服务" min-width="150">
        <template #default="{ row }">
          {{ row.serviceItem?.game?.name }} / {{ row.serviceItem?.name }}
        </template>
      </el-table-column>
      <el-table-column label="老板" width="100">
        <template #default="{ row }">{{ row.customer?.nickname }}</template>
      </el-table-column>
      <el-table-column label="陪玩" width="100">
        <template #default="{ row }">{{ row.provider?.nickname || '-' }}</template>
      </el-table-column>
      <el-table-column prop="duration" label="数量" width="70" />
      <el-table-column prop="totalAmount" label="金额(星石)" width="100" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="创建时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
          <el-button v-if="['ASSIGNED','SERVING'].includes(row.status)" size="small" type="warning" @click="openReassign(row)">转派</el-button>
          <el-button size="small" @click="viewRecords(row)">记录</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      style="margin-top: 16px; justify-content: flex-end"
      :current-page="query.page"
      :page-size="query.pageSize"
      :total="total"
      layout="total, prev, pager, next"
      @current-change="handlePageChange"
    />

    <!-- 订单详情弹窗 -->
    <el-dialog v-model="detailDialog" title="订单详情" width="600px">
      <el-descriptions :column="2" border v-if="currentOrder">
        <el-descriptions-item label="订单号">{{ currentOrder.orderNo }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="statusType(currentOrder.status)">{{ statusText(currentOrder.status) }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="游戏">{{ currentOrder.serviceItem?.game?.name }}</el-descriptions-item>
        <el-descriptions-item label="服务">{{ currentOrder.serviceItem?.name }}</el-descriptions-item>
        <el-descriptions-item label="老板">{{ currentOrder.customer?.nickname }}</el-descriptions-item>
        <el-descriptions-item label="陪玩">{{ currentOrder.provider?.nickname || '-' }}</el-descriptions-item>
        <el-descriptions-item label="数量">{{ currentOrder.duration }}</el-descriptions-item>
        <el-descriptions-item label="单价">{{ currentOrder.unitPrice }} 星石</el-descriptions-item>
        <el-descriptions-item label="总金额">{{ currentOrder.totalAmount }} 星石</el-descriptions-item>
        <el-descriptions-item label="平台抽成">{{ currentOrder.platformFee || 0 }} 星石</el-descriptions-item>
        <el-descriptions-item label="老板要求" :span="2">{{ currentOrder.requirement || '-' }}</el-descriptions-item>
        <el-descriptions-item label="联系方式" :span="2">
          {{ currentOrder.contactType }}: {{ currentOrder.contactValue }}
        </el-descriptions-item>
      </el-descriptions>
    </el-dialog>

    <!-- 转派弹窗 -->
    <el-dialog v-model="reassignDialog" title="转派订单" width="480px">
      <el-form v-if="reassignOrder" label-width="80px">
        <el-form-item label="原陪玩">
          <span>{{ reassignOrder.provider?.nickname }}</span>
        </el-form-item>
        <el-form-item label="新陪玩">
          <el-select v-model="reassignNewProvider" placeholder="选择新陪玩" style="width: 100%">
            <el-option v-for="p in providers" :key="p.id" :label="`${p.nickname} (${p.providerProfile?.level}级)`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="转派原因">
          <el-input v-model="reassignReason" type="textarea" :rows="3" placeholder="请输入转派原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="reassignDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!reassignNewProvider" @click="doReassign">确认转派</el-button>
      </template>
    </el-dialog>

    <!-- 派单记录弹窗 -->
    <el-dialog v-model="recordsDialog" title="派单记录" width="560px">
      <div v-if="dispatchRecords.length === 0" style="text-align:center;color:#999;padding:40px 0;">暂无派单记录</div>
      <div v-else class="record-list">
        <div v-for="r in dispatchRecords" :key="r.id" class="record-item">
          <el-tag :type="recordType(r.type)" size="small">{{ recordTypeText(r.type) }}</el-tag>
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
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOrderList } from '@/api'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const providers = ref<any[]>([])
const query = reactive({ page: 1, pageSize: 20, orderNo: '', status: '' })
const detailDialog = ref(false)
const currentOrder = ref<any>(null)

const reassignDialog = ref(false)
const reassignOrder = ref<any>(null)
const reassignNewProvider = ref<number | ''>('')
const reassignReason = ref('')

const recordsDialog = ref(false)
const dispatchRecords = ref<any[]>([])

const statusOptions = [
  { label: '已创建', value: 'CREATED' },
  { label: '待接单', value: 'PAID' },
  { label: '已接单', value: 'ASSIGNED' },
  { label: '服务中', value: 'SERVING' },
  { label: '待审核', value: 'REVIEWING' },
  { label: '已完成', value: 'COMPLETED' },
  { label: '已取消', value: 'CANCELLED' },
  { label: '已过期', value: 'EXPIRED' },
]

onMounted(async () => {
  await loadData()
  // 加载陪玩列表
  try {
    const res: any = await request.get('/admin/users', { params: { role: 'PROVIDER', pageSize: 200 } })
    providers.value = res?.list || []
  } catch (e) { /* ignore */ }
})

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getOrderList(query)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => { query.page = page; loadData() }
const statusText = (s: string) => statusOptions.find(o => o.value === s)?.label || s
const statusType = (s: string) => ({
  CREATED: 'info', PAID: 'warning', ASSIGNED: 'primary', SERVING: '',
  REVIEWING: 'warning', COMPLETED: 'success', CANCELLED: 'danger', EXPIRED: 'info',
}[s] || '')
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const viewDetail = (row: any) => {
  currentOrder.value = row
  detailDialog.value = true
}

const openReassign = (row: any) => {
  reassignOrder.value = row
  reassignNewProvider.value = ''
  reassignReason.value = ''
  reassignDialog.value = true
}

const doReassign = async () => {
  if (!reassignNewProvider.value || !reassignOrder.value) return
  try {
    await request.post(`/admin/orders/${reassignOrder.value.id}/reassign`, {
      newProviderId: reassignNewProvider.value,
      reason: reassignReason.value,
    })
    ElMessage.success('转派成功')
    reassignDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '转派失败')
  }
}

const viewRecords = async (row: any) => {
  try {
    const res: any = await request.get(`/admin/orders/${row.id}/dispatch-records`)
    dispatchRecords.value = res || []
    recordsDialog.value = true
  } catch (e) {
    ElMessage.error('获取派单记录失败')
  }
}

const recordType = (t: string) => ({
  DISPATCH: 'primary', AUTO: 'purple', REDISPATCH: 'warning', GRAB: 'success',
}[t] || '')
const recordTypeText = (t: string) => ({
  DISPATCH: '手动派单', AUTO: '自动派单', REDISPATCH: '转派', GRAB: '抢单',
}[t] || t)
</script>

<style scoped>
.search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
.record-list { max-height: 400px; overflow-y: auto; }
.record-item { display: flex; gap: 12px; padding: 12px; border-bottom: 1px solid #f0f0f0; }
.record-detail { flex: 1; font-size: 13px; }
.record-meta { color: #999; font-size: 12px; margin-top: 4px; display: flex; gap: 16px; }
.record-reason { color: #666; margin-top: 4px; }
</style>
