<template>
  <div>
    <div class="search-bar">
      <el-select v-model="query.status" placeholder="审核状态" clearable style="width: 140px" @change="loadData">
        <el-option label="待审核" value="PENDING" />
        <el-option label="已通过" value="APPROVED" />
        <el-option label="已打款" value="PAID" />
        <el-option label="已拒绝" value="REJECTED" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column label="用户" width="120">
        <template #default="{ row }">{{ row.user?.nickname }}</template>
      </el-table-column>
      <el-table-column label="手机号" width="130">
        <template #default="{ row }">{{ row.user?.phone }}</template>
      </el-table-column>
      <el-table-column prop="amount" label="提现星石" width="100" />
      <el-table-column prop="fee" label="手续费" width="90" />
      <el-table-column prop="realAmount" label="到账金额(元)" width="110" />
      <el-table-column label="收款方式" width="100">
        <template #default="{ row }">{{ payMethodText(row.payMethod) }}</template>
      </el-table-column>
      <el-table-column label="收款账号" min-width="150">
        <template #default="{ row }">{{ row.payName }} / {{ row.payAccount }}</template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createdAt" label="申请时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button v-if="row.status === 'PENDING'" size="small" type="success" @click="handleApprove(row)">通过打款</el-button>
          <el-button v-if="row.status === 'PENDING'" size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
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
    <el-dialog v-model="rejectDialog" title="拒绝提现" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectForm.comment" type="textarea" :rows="3" />
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
import { getWithdrawList, reviewWithdraw } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20, status: 'PENDING' })
const rejectDialog = ref(false)
const rejectForm = reactive({ id: 0, comment: '' })

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getWithdrawList(query)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => { query.page = page; loadData() }
const payMethodText = (m: string) => ({ alipay: '支付宝', wechat: '微信', bank: '银行卡' }[m] || m)
const statusText = (s: string) => ({ PENDING: '待审核', APPROVED: '已通过', PAID: '已打款', REJECTED: '已拒绝' }[s] || s)
const statusType = (s: string) => ({ PENDING: 'warning', APPROVED: 'primary', PAID: 'success', REJECTED: 'danger' }[s] || '')
const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const handleApprove = async (row: any) => {
  await ElMessageBox.confirm(
    `确定给「${row.user?.nickname}」打款 ${row.realAmount} 元吗？\n打款后金额将从用户冻结余额中扣除`,
    '打款确认',
    { type: 'success' }
  )
  await reviewWithdraw(row.id, { status: 'APPROVED' })
  ElMessage.success('已通过打款')
  loadData()
}

const handleReject = (row: any) => {
  rejectForm.id = row.id
  rejectForm.comment = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectForm.comment) { ElMessage.warning('请输入拒绝原因'); return }
  await reviewWithdraw(rejectForm.id, { status: 'REJECTED', comment: rejectForm.comment })
  ElMessage.success('已拒绝，金额已退回')
  rejectDialog.value = false
  loadData()
}

onMounted(loadData)
</script>
