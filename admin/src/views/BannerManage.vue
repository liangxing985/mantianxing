<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">轮播图管理</h2>
      <el-button type="primary" @click="openCreate">+ 新增轮播图</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe style="width: 100%">
      <el-table-column prop="id" label="ID" width="80" />
      <el-table-column label="图片" width="200">
        <template #default="{ row }">
          <el-image v-if="row.image" :src="row.image" style="width:160px;height:60px;border-radius:4px" fit="cover" />
          <span v-else style="color:#ccc">-</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="标题" min-width="150" />
      <el-table-column label="跳转链接" min-width="200">
        <template #default="{ row }">
          <span v-if="row.linkUrl" style="color:#409eff;cursor:pointer;" @click="openLink(row.linkUrl)">{{ row.linkUrl }}</span>
          <span v-else style="color:#ccc">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="80" />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.isActive ? 'success' : 'info'">{{ row.isActive ? '启用' : '禁用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" :type="row.isActive ? 'warning' : 'success'" @click="handleToggle(row)">
            {{ row.isActive ? '禁用' : '启用' }}
          </el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="editing ? '编辑轮播图' : '新增轮播图'" width="560px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="轮播图标题" />
        </el-form-item>
        <el-form-item label="图片">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="(opts:any)=>handleUpload(opts)"
            accept="image/*"
          >
            <div v-if="form.image" class="upload-preview">
              <img :src="form.image" style="width:240px;height:90px;object-fit:cover;border-radius:4px;" />
            </div>
            <el-button v-else size="small">点击上传图片</el-button>
          </el-upload>
          <div style="color:#909399;font-size:12px;margin-top:4px;">建议尺寸 1920x600，不超过5MB</div>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="可选，点击跳转的URL" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :disabled="!form.title || !form.image">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { uploadImage } from '@/api'

const loading = ref(false)
const list = ref<any[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const form = reactive({ id: 0, title: '', image: '', linkUrl: '', sortOrder: 0, isActive: true })

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const res: any = await request.get('/banner')
    list.value = res.list || res || []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function beforeUpload(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.error('图片不能超过5MB')
    return false
  }
  if (!file.type.startsWith('image/')) {
    ElMessage.error('只能上传图片')
    return false
  }
  return true
}

async function handleUpload(opts: any) {
  try {
    const res: any = await uploadImage(opts.file)
    form.image = res.url || res.data?.url || ''
    ElMessage.success('上传成功')
  } catch (e) {
    ElMessage.error('上传失败')
  }
}

function openLink(url: string) {
  window.open(url, '_blank')
}

function openCreate() {
  editing.value = false
  Object.assign(form, { id: 0, title: '', image: '', linkUrl: '', sortOrder: 0, isActive: true })
  dialogVisible.value = true
}

function openEdit(row: any) {
  editing.value = true
  Object.assign(form, { id: 0, title: '', image: '', linkUrl: '', sortOrder: 0, isActive: true }, row)
  dialogVisible.value = true
}

async function handleSave() {
  try {
    if (editing.value) {
      await request.put(`/banner/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/banner', form)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

async function handleToggle(row: any) {
  try {
    await request.put(`/banner/${row.id}/toggle`, { isActive: !row.isActive })
    ElMessage.success('操作成功')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  }
}

async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除轮播图"${row.title}"吗？`, '确认删除', { type: 'warning' })
    await request.delete(`/banner/${row.id}`)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.message || '删除失败')
  }
}
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { margin: 0; font-size: 18px; }
.upload-preview { display: inline-block; cursor: pointer; }
</style>
