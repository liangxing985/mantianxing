<template>
  <div>
    <div class="search-bar">
      <el-select v-model="query.applyStatus" placeholder="审核状态" clearable style="width: 140px" @change="loadData">
        <el-option label="待审核" value="PENDING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已拒绝" value="REJECTED" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户名" width="120">
        <template #default="{ row }">{{ row.user?.username }}</template>
      </el-table-column>
      <el-table-column label="昵称" width="120">
        <template #default="{ row }">{{ row.user?.nickname }}</template>
      </el-table-column>
      <el-table-column label="手机号" width="130">
        <template #default="{ row }">{{ row.user?.phone }}</template>
      </el-table-column>
      <el-table-column prop="level" label="等级" width="80" />
      <el-table-column prop="rating" label="评分" width="80" />
      <el-table-column label="审核状态" width="100">
        <template #default="{ row }">
          <el-tag :type="statusType(row.applyStatus)">{{ statusText(row.applyStatus) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="rejectReason" label="拒绝原因" min-width="150" show-overflow-tooltip />
      <el-table-column prop="createdAt" label="申请时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.applyStatus === 'PENDING'" size="small" type="success" @click="handleApprove(row)">通过</el-button>
          <el-button v-if="row.applyStatus === 'PENDING'" size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
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

    <!-- 拒绝弹窗 -->
    <el-dialog v-model="rejectDialog" title="拒绝入驻" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProviderApplyList, reviewProviderApply } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20, applyStatus: 'PENDING' })

const rejectDialog = ref(false)
const rejectForm = reactive({ id: 0, reason: '' })

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getProviderApplyList(query)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => { query.page = page; loadData() }
const statusText = (s: string) => ({ PENDING: '待审核', APPROVED: '已通过', REJECTED: '已拒绝' }[s] || s)
const statusType = (s: string) => ({ PENDING: 'warning', APPROVED: 'success', REJECTED: 'danger' }[s] || '')
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const handleApprove = async (row: any) => {
  await ElMessageBox.confirm(`确定通过「${row.user?.nickname}」的陪玩入驻申请吗？`, '提示', { type: 'success' })
  await reviewProviderApply(row.id, { status: 'APPROVED' })
  ElMessage.success('已通过')
  loadData()
}

const handleReject = (row: any) => {
  rejectForm.id = row.id
  rejectForm.reason = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectForm.reason) { ElMessage.warning('请输入拒绝原因'); return }
  await reviewProviderApply(rejectForm.id, { status: 'REJECTED', reason: rejectForm.reason })
  ElMessage.success('已拒绝')
  rejectDialog.value = false
  loadData()
}

onMounted(loadData)
</script>
