<template>
  <div class="manage-page">
    <div class="page-header">
      <h2>{{ title }}</h2>
      <button class="add-btn" @click="showAdd = true">+ 新增</button>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th v-for="col in columns" :key="col.key">{{ col.label }}</th>
          <th>操作</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in list" :key="row.id">
          <td v-for="col in columns" :key="col.key">{{ row[col.key] }}</td>
          <td>
            <button class="link-btn" @click="editRow(row)">编辑</button>
            <button class="link-btn danger" @click="deleteRow(row.id)">删除</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- 新增/编辑弹窗 -->
    <div v-if="showAdd" class="modal" @click.self="showAdd = false">
      <div class="modal-content">
        <h3>{{ editingId ? '编辑' : '新增' }}{{ title }}</h3>
        <div v-for="col in columns" :key="col.key" class="form-item">
          <label>{{ col.label }}</label>
          <input v-if="col.type !== 'textarea'" v-model="form[col.key]" :type="col.type || 'text'" />
          <textarea v-else v-model="form[col.key]"></textarea>
        </div>
        <div class="modal-actions">
          <button @click="showAdd = false">取消</button>
          <button class="confirm" @click="save">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps<{
  title: string
  apiBase: string
  columns: { key: string; label: string; type?: string }[]
}>()

const list = ref<any[]>([])
const showAdd = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<Record<string, any>>({})

onMounted(loadList)

async function loadList() {
  const res = await request.get(props.apiBase)
  list.value = res as any
}

function editRow(row: any) {
  editingId.value = row.id
  Object.assign(form, row)
  showAdd.value = true
}

function resetForm() {
  props.columns.forEach(c => { form[c.key] = c.type === 'number' ? 0 : '' })
}

async function save() {
  try {
    if (editingId.value) {
      await request.put(`${props.apiBase}/${editingId.value}`, form)
    } else {
      await request.post(props.apiBase, form)
    }
    ElMessage.success('保存成功')
    showAdd.value = false
    editingId.value = null
    resetForm()
    loadList()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '保存失败')
  }
}

async function deleteRow(id: number) {
  await ElMessageBox.confirm('确认删除？', '提示', { type: 'warning' })
  await request.delete(`${props.apiBase}/${id}`)
  ElMessage.success('删除成功')
  loadList()
}
</script>

<style scoped>
.manage-page { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
h2 { margin: 0; }
.add-btn { padding: 8px 20px; background: #1677ff; color: #fff; border: none; border-radius: 6px; cursor: pointer; }
.data-table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; }
.data-table th, .data-table td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
.data-table th { background: #fafafa; font-weight: 600; }
.link-btn { background: none; border: none; color: #1677ff; cursor: pointer; margin-right: 12px; }
.link-btn.danger { color: #ff4d4f; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: #fff; border-radius: 10px; padding: 24px; width: 400px; max-height: 80vh; overflow-y: auto; }
.modal-content h3 { margin: 0 0 20px; }
.form-item { margin-bottom: 16px; }
.form-item label { display: block; font-size: 13px; color: #666; margin-bottom: 6px; }
.form-item input, .form-item textarea { width: 100%; padding: 8px 12px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; box-sizing: border-box; }
.form-item textarea { min-height: 80px; resize: vertical; }
.modal-actions { display: flex; gap: 12px; margin-top: 20px; }
.modal-actions button { flex: 1; padding: 10px; border: 1px solid #ddd; background: #fff; border-radius: 6px; cursor: pointer; }
.modal-actions .confirm { background: #1677ff; color: #fff; border-color: #1677ff; }
</style>
