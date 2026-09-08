<template>
  <div>
    <el-alert title="报单审核是核心环节，审核通过后系统自动结算给陪玩，请仔细核对截图凭证" type="warning" :closable="false" style="margin-bottom: 16px;" />

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="orderNo" label="订单号" width="180" />
      <el-table-column label="游戏/服务" min-width="140">
        <template #default="{ row }">{{ row.serviceItem?.game?.name }} / {{ row.serviceItem?.name }}</template>
      </el-table-column>
      <el-table-column label="老板" width="90">
        <template #default="{ row }">{{ row.customer?.nickname }}</template>
      </el-table-column>
      <el-table-column label="陪玩" width="90">
        <template #default="{ row }">{{ row.provider?.nickname }}</template>
      </el-table-column>
      <el-table-column prop="totalAmount" label="金额" width="90" />
      <el-table-column label="凭证" width="200">
        <template #default="{ row }">
          <div class="evidence-thumbs">
            <el-image
              v-for="(ev, idx) in row.evidences?.slice(0, 3)"
              :key="idx"
              :src="ev.imageUrl"
              :preview-src-list="row.evidences?.map((e: any) => e.imageUrl)"
              fit="cover"
              style="width: 50px; height: 50px; margin-right: 4px; border-radius: 4px;"
            />
            <span v-if="row.evidences?.length > 3" class="more">+{{ row.evidences.length - 3 }}</span>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="submittedAt" label="提交时间" width="170">
        <template #default="{ row }">{{ formatTime(row.submittedAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="success" @click="handleApprove(row)">通过</el-button>
          <el-button size="small" type="danger" @click="handleReject(row)">驳回</el-button>
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

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectDialog" title="驳回报单" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="驳回原因" required>
          <el-input v-model="rejectForm.comment" type="textarea" :rows="3" placeholder="请输入驳回原因，将通知陪玩重新提交" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认驳回</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getReviewList, approveReport, rejectReport, getSystemConfig } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20 })
const rejectDialog = ref(false)
const rejectForm = reactive({ id: 0, comment: '' })
const feeRate = ref(20)

const loadData = async () => {
  loading.value = true
  try {
    const [res, config]: any[] = await Promise.all([
      getReviewList(query),
      getSystemConfig().catch(() => ({})),
    ])
    list.value = res.list
    total.value = res.total
    if (config.platform_fee_rate) feeRate.value = Number(config.platform_fee_rate)
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => { query.page = page; loadData() }
const formatTime = (t: string) => t ? dayjs(t).format('YYYY-MM-DD HH:mm') : '-'

const handleApprove = async (row: any) => {
  await ElMessageBox.confirm(
    `确定通过订单「${row.orderNo}」的报单吗？\n通过后将自动结算 ${row.totalAmount} 星石（平台抽成${feeRate.value}%）`,
    '审核确认',
    { type: 'success', confirmButtonText: '通过并结算' }
  )
  await approveReport(row.id)
  ElMessage.success('审核通过，已结算')
  loadData()
}

const handleReject = (row: any) => {
  rejectForm.id = row.id
  rejectForm.comment = ''
  rejectDialog.value = true
}

const confirmReject = async () => {
  if (!rejectForm.comment) { ElMessage.warning('请输入驳回原因'); return }
  await rejectReport(rejectForm.id, rejectForm.comment)
  ElMessage.success('已驳回，订单回到服务中')
  rejectDialog.value = false
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.evidence-thumbs {
  display: flex;
  align-items: center;
}
.more {
  font-size: 12px;
  color: #909399;
}
</style>
