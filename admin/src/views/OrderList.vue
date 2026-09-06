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
      <el-table-column label="操作" width="100" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="viewDetail(row)">详情</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { getOrderList } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20, orderNo: '', status: '' })
const detailDialog = ref(false)
const currentOrder = ref<any>(null)

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

onMounted(loadData)
</script>
