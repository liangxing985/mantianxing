<template>
  <div class="game-category-manage">
    <div class="page-header">
      <h2>游戏分类管理</h2>
      <el-button type="primary" @click="openCreate">+ 新增分类</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="图标" width="80">
        <template #default="{ row }">
          <template v-if="row">
            <el-image v-if="row.icon" :src="row.icon" style="width:32px;height:32px;border-radius:6px;" fit="cover" />
            <span v-else style="color:#ccc;">-</span>
          </template>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="分类名称" width="150" />
      <el-table-column label="游戏数量" width="100">
        <template #default="{ row }">{{ row?._count?.games || 0 }}</template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag v-if="row" :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑分类' : '新增分类'" width="480px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="form.name" placeholder="如：端游、手游、MOBA、FPS" />
        </el-form-item>
        <el-form-item label="图标URL">
          <el-input v-model="form.icon" placeholder="图标图片地址" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :disabled="!form.name">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const list = ref<any[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const form = reactive({ id: 0, name: '', icon: '', sortOrder: 0, isEnabled: true })

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const res: any = await request.get('/game-categories/admin/list')
    const arr = Array.isArray(res) ? res : (Array.isArray(res?.list) ? res.list : [])
    list.value = arr.filter((item: any) => item && typeof item === 'object')
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = false
  Object.assign(form, { id: 0, name: '', icon: '', sortOrder: 0, isEnabled: true })
  dialogVisible.value = true
}

function openEdit(row: any) {
  editing.value = true
  Object.assign(form, row)
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editing.value) {
      await request.put(`/game-categories/admin/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/game-categories/admin', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除分类"${row.name}"吗？`, '确认删除', { type: 'warning' })
    await request.delete(`/game-categories/admin/${row.id}`)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.message || '删除失败')
  }
}
</script>

<style scoped>
.game-category-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; }
</style>
