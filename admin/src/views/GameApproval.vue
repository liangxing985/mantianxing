<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">陪玩游戏审核</h2>
      <el-button @click="loadData" :icon="Refresh">刷新</el-button>
    </div>

    <div class="content-card">
      <el-table :data="list" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="陪玩" width="200">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 10px;">
              <el-avatar :size="36" :src="row.providerProfile?.user?.avatar">
                {{ row.providerProfile?.user?.nickname?.charAt(0) }}
              </el-avatar>
              <div>
                <div style="font-weight: 500;">{{ row.providerProfile?.user?.nickname }}</div>
                <div style="font-size: 12px; color: #909399;">{{ row.providerProfile?.user?.username }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="申请游戏" width="200">
          <template #default="{ row }">
            <el-tag type="primary">{{ row.game?.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="申请时间" width="200">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag type="warning">待审核</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="180">
          <template #default="{ row }">
            <el-button type="success" size="small" @click="handleApprove(row)">通过</el-button>
            <el-button type="danger" size="small" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && list.length === 0" description="暂无待审核的游戏申请" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'

const list = ref<any[]>([])
const loading = ref(false)

const loadData = async () => {
  loading.value = true
  try {
    list.value = await request.get('/admin/game-approvals')
  } finally {
    loading.value = false
  }
}

const handleApprove = async (row: any) => {
  await ElMessageBox.confirm(`确定通过陪玩「${row.providerProfile?.user?.nickname}」的游戏「${row.game?.name}」申请吗？`, '提示', {
    type: 'success',
  })
  await request.put(`/admin/game-approvals/${row.id}`, { status: 'APPROVED' })
  ElMessage.success('已通过')
  loadData()
}

const handleReject = async (row: any) => {
  await ElMessageBox.confirm(`确定驳回陪玩「${row.providerProfile?.user?.nickname}」的游戏「${row.game?.name}」申请吗？`, '提示', {
    type: 'warning',
  })
  await request.put(`/admin/game-approvals/${row.id}`, { status: 'REJECTED' })
  ElMessage.success('已驳回')
  loadData()
}

const formatTime = (time: string) => {
  return new Date(time).toLocaleString('zh-CN')
}

onMounted(loadData)
</script>

<style scoped>
.page-container { padding: 0; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}
.content-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border: 1px solid #eef0f4;
}
</style>
