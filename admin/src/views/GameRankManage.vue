<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">游戏段位管理</h2>
      <div class="header-actions">
        <el-select v-model="filterGameId" placeholder="筛选游戏" clearable style="width:200px;margin-right:12px" @change="loadData">
          <el-option v-for="g in games" :key="g.id" :label="g.name" :value="g.id" />
        </el-select>
        <el-button type="primary" @click="openCreate">+ 新增段位</el-button>
      </div>
    </div>

    <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="所属游戏" width="150">
        <template #default="{ row }">
          {{ row.game?.name || '-' }}
        </template>
      </el-table-column>
      <el-table-column prop="name" label="段位名称" min-width="150" />
      <el-table-column prop="level" label="等级" width="80" />
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column prop="createdAt" label="创建时间" width="180">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑段位' : '新增段位'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="所属游戏">
          <el-select v-model="form.gameId" placeholder="选择游戏" style="width:100%">
            <el-option v-for="g in games" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="段位名称">
          <el-input v-model="form.name" placeholder="如：青铜、白银、黄金、铂金、钻石、王者" />
        </el-form-item>
        <el-form-item label="等级">
          <el-input-number v-model="form.level" :min="1" :max="100" />
          <span style="color:#909399;font-size:12px;margin-left:8px;">用于排序和按段位定价</span>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :disabled="!form.name || !form.gameId">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<!--
  段位管理页面
  功能：按游戏筛选段位、段位列表、新增/编辑/删除段位
  段位用于陪玩按段位定价功能
-->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const games = ref<any[]>([])
const filterGameId = ref<number | null>(null)
const dialogVisible = ref(false)
const editing = ref(false)
const form = reactive({ id: 0, gameId: 0, name: '', level: 1, sortOrder: 0 })

const formatDate = (d: string) => {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN')
}

const loadGames = async () => {
  try {
    const res: any = await request.get('/game/list')
    games.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    games.value = []
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const params: any = {}
    if (filterGameId.value) params.gameId = filterGameId.value
    const res: any = await request.get('/game-rank/list', { params })
    tableData.value = Array.isArray(res) ? res : (res?.data || [])
  } catch (e) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

const openCreate = () => {
  editing.value = false
  form.id = 0
  form.gameId = filterGameId.value || 0
  form.name = ''
  form.level = 1
  form.sortOrder = 0
  dialogVisible.value = true
}

const openEdit = (row: any) => {
  editing.value = true
  form.id = row.id
  form.gameId = row.gameId
  form.name = row.name
  form.level = row.level
  form.sortOrder = row.sortOrder
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    if (editing.value) {
      await request.put(`/game-rank/${form.id}`, {
        name: form.name,
        level: form.level,
        sortOrder: form.sortOrder,
      })
      ElMessage.success('更新成功')
    } else {
      await request.post('/game-rank/create', {
        gameId: form.gameId,
        name: form.name,
        level: form.level,
        sortOrder: form.sortOrder,
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

const handleDelete = (row: any) => {
  ElMessageBox.confirm(`确定删除段位「${row.name}」吗？`, '确认删除', {
    type: 'warning',
  }).then(async () => {
    try {
      await request.delete(`/game-rank/${row.id}`)
      ElMessage.success('删除成功')
      loadData()
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || '删除失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  loadGames()
  loadData()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
.header-actions {
  display: flex;
  align-items: center;
}
</style>
