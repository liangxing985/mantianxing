<template>
  <div>
    <div class="page-header">
      <span class="page-title">活动管理</span>
      <div>
        <el-input v-model="keyword" placeholder="搜索活动标题" clearable style="width:200px;margin-right:12px;" @clear="loadList" @keyup.enter="loadList" />
        <el-button type="primary" @click="openDialog()">发布活动</el-button>
      </div>
    </div>

    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="图片" width="100">
        <template #default="{ row }">
          <el-image v-if="row.image" :src="row.image" style="width:70px;height:40px;border-radius:4px;" fit="cover" />
          <span v-else style="color:#ccc;">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="活动标题" min-width="150" />
      <el-table-column prop="content" label="活动内容" min-width="150" show-overflow-tooltip />
      <el-table-column label="时间" width="200">
        <template #default="{ row }">
          <div style="font-size:12px;">
            <div>开始: {{ row.startTime ? formatDate(row.startTime) : '不限' }}</div>
            <div>结束: {{ row.endTime ? formatDate(row.endTime) : '不限' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="sortOrder" label="排序" width="70" />
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-switch :model-value="row.isActive" @change="(v:any)=>toggle(row,v)" />
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openDialog(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination style="margin-top:16px;justify-content:flex-end;display:flex;"
      v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" @current-change="loadList" />

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialog" :title="form.id ? '编辑活动' : '发布活动'" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="活动标题" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="活动内容">
          <el-input v-model="form.content" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="活动图片">
          <el-input v-model="form.image" placeholder="图片URL或base64" />
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.linkUrl" placeholder="可选，点击活动跳转的URL" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="不限则留空" style="width:100%;" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="不限则留空" style="width:100%;" value-format="YYYY-MM-DD HH:mm:ss" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="发布">
          <el-switch v-model="form.isActive" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog = false">取消</el-button>
        <el-button type="primary" @click="save" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getActivityList, createActivity, updateActivity, deleteActivity, toggleActivity } from '@/api'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const dialog = ref(false)
const form = reactive({ id: null as number | null, title: '', content: '', image: '', linkUrl: '', startTime: '', endTime: '', sortOrder: 0, isActive: true })

const formatDate = (d: string) => d ? d.replace('T', ' ').substring(0, 16) : ''

const loadList = async () => {
  loading.value = true
  try {
    const res: any = await getActivityList({ page: page.value, pageSize: pageSize.value, keyword: keyword.value })
    const data = res.data || res
    list.value = data.list || []
    total.value = data.total || 0
  } finally { loading.value = false }
}

const openDialog = (row?: any) => {
  if (row) {
    Object.assign(form, { ...row, startTime: row.startTime || '', endTime: row.endTime || '' })
  } else {
    Object.assign(form, { id: null, title: '', content: '', image: '', linkUrl: '', startTime: '', endTime: '', sortOrder: 0, isActive: true })
  }
  dialog.value = true
}

const save = async () => {
  if (!form.title) { ElMessage.warning('请输入活动标题'); return }
  saving.value = true
  try {
    const payload: any = { ...form }
    if (!payload.startTime) payload.startTime = null
    if (!payload.endTime) payload.endTime = null
    if (form.id) {
      await updateActivity(form.id, payload)
    } else {
      await createActivity(payload)
    }
    ElMessage.success('保存成功')
    dialog.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

const toggle = async (row: any, v: boolean) => {
  await toggleActivity(row.id, v)
  ElMessage.success(v ? '已发布' : '已下架')
}

const remove = async (row: any) => {
  await ElMessageBox.confirm(`确定删除活动「${row.title}」？`, '确认', { type: 'warning' })
  await deleteActivity(row.id)
  ElMessage.success('已删除')
  loadList()
}

onMounted(loadList)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; }
</style>
