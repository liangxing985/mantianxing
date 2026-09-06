<template>
  <div>
    <div class="search-bar">
      <el-input v-model="query.keyword" placeholder="搜索用户名/昵称/手机号" clearable style="width: 240px" @clear="loadData" @keyup.enter="loadData" />
      <el-select v-model="query.role" placeholder="角色" clearable style="width: 120px" @change="loadData">
        <el-option label="老板" value="CUSTOMER" />
        <el-option label="陪玩" value="PROVIDER" />
        <el-option label="管理员" value="ADMIN" />
        <el-option label="客服" value="OPERATOR" />
      </el-select>
      <el-select v-model="query.status" placeholder="状态" clearable style="width: 120px" @change="loadData">
        <el-option label="正常" value="ACTIVE" />
        <el-option label="禁用" value="DISABLED" />
        <el-option label="冻结" value="FROZEN" />
      </el-select>
      <el-button type="primary" @click="loadData">搜索</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="70" />
      <el-table-column prop="username" label="用户名" width="120" />
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="phone" label="手机号" width="130" />
      <el-table-column label="角色" width="90">
        <template #default="{ row }">
          <el-tag :type="roleTagType(row.role)">{{ roleText(row.role) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 'ACTIVE' ? 'success' : 'danger'">
            {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="余额(星石)" width="110">
        <template #default="{ row }">{{ row.wallet?.balance || 0 }}</template>
      </el-table-column>
      <el-table-column label="陪玩等级" width="90">
        <template #default="{ row }">{{ row.providerProfile?.level || '-' }}</template>
      </el-table-column>
      <el-table-column prop="createdAt" label="注册时间" width="170">
        <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="handleRecharge(row)">充值</el-button>
          <el-button size="small" :type="row.status === 'ACTIVE' ? 'danger' : 'success'" @click="toggleStatus(row)">
            {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
          </el-button>
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

    <!-- 充值弹窗 -->
    <el-dialog v-model="rechargeDialog" title="手动充值" width="400px">
      <el-form :model="rechargeForm" label-width="80px">
        <el-form-item label="用户">{{ rechargeForm.nickname }}</el-form-item>
        <el-form-item label="星石数">
          <el-input-number v-model="rechargeForm.amount" :min="1" :max="1000000" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="rechargeForm.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rechargeDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmRecharge">确认充值</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getUserList, toggleUserStatus, manualRecharge } from '@/api'
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref([])
const total = ref(0)
const query = reactive({ page: 1, pageSize: 20, keyword: '', role: '', status: '' })

const rechargeDialog = ref(false)
const rechargeForm = reactive({ userId: 0, nickname: '', amount: 100, remark: '' })

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getUserList(query)
    list.value = res.list
    total.value = res.total
  } finally {
    loading.value = false
  }
}

const handlePageChange = (page: number) => {
  query.page = page
  loadData()
}

const roleText = (role: string) => ({ CUSTOMER: '老板', PROVIDER: '陪玩', ADMIN: '管理员', OPERATOR: '客服' }[role] || role)
const roleTagType = (role: string) => ({ CUSTOMER: '', PROVIDER: 'success', ADMIN: 'danger', OPERATOR: 'warning' }[role] || '')

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const toggleStatus = async (row: any) => {
  const action = row.status === 'ACTIVE' ? '禁用' : '启用'
  await ElMessageBox.confirm(`确定要${action}用户「${row.nickname}」吗？`, '提示', { type: 'warning' })
  await toggleUserStatus(row.id, row.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')
  ElMessage.success(`${action}成功`)
  loadData()
}

const handleRecharge = (row: any) => {
  rechargeForm.userId = row.id
  rechargeForm.nickname = row.nickname
  rechargeForm.amount = 100
  rechargeForm.remark = ''
  rechargeDialog.value = true
}

const confirmRecharge = async () => {
  await manualRecharge({ userId: rechargeForm.userId, amount: rechargeForm.amount, remark: rechargeForm.remark })
  ElMessage.success('充值成功')
  rechargeDialog.value = false
  loadData()
}

onMounted(loadData)
</script>
