<template>
  <div class="coupon-manage">
    <div class="page-header">
      <h2>优惠券管理</h2>
      <el-button type="primary" @click="openCreate">+ 新增优惠券</el-button>
    </div>

    <el-table :data="list" v-loading="loading" border stripe>
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column prop="name" label="名称" min-width="150" />
      <el-table-column label="类型" width="100">
        <template #default="{ row }">
          <el-tag :type="typeColor(row.type)">{{ typeText(row.type) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="优惠值" width="120">
        <template #default="{ row }">
          <span v-if="row.type === 'FIXED'">减 {{ row.discountValue }} 星石</span>
          <span v-else-if="row.type === 'DISCOUNT'">{{ row.discountValue / 10 }} 折</span>
          <span v-else>新人券</span>
        </template>
      </el-table-column>
      <el-table-column prop="minAmount" label="最低消费" width="100" />
      <el-table-column label="领取情况" width="140">
        <template #default="{ row }">
          {{ row.usedCount }}/{{ row.totalCount === 0 ? '不限' : row.totalCount }}
        </template>
      </el-table-column>
      <el-table-column prop="perUserLimit" label="每人限领" width="90" />
      <el-table-column label="有效期" width="200">
        <template #default="{ row }">
          <span v-if="row.startTime || row.endTime">
            {{ row.startTime ? fmt(row.startTime) : '长期' }} ~ {{ row.endTime ? fmt(row.endTime) : '长期' }}
          </span>
          <span v-else>长期有效</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.isEnabled ? 'success' : 'info'">{{ row.isEnabled ? '上架' : '下架' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑优惠券' : '新增优惠券'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="优惠券名称">
          <el-input v-model="form.name" placeholder="如：新人专享5元券" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width:100%">
            <el-option label="满减券（减固定金额）" value="FIXED" />
            <el-option label="折扣券（按折扣）" value="DISCOUNT" />
            <el-option label="新人券" value="NEWBIE" />
          </el-select>
        </el-form-item>
        <el-form-item :label="form.type === 'DISCOUNT' ? '折扣(如80=8折)' : '减免星石'">
          <el-input-number v-model="form.discountValue" :min="1" />
        </el-form-item>
        <el-form-item label="最低消费(星石)">
          <el-input-number v-model="form.minAmount" :min="0" />
        </el-form-item>
        <el-form-item label="发放总量">
          <el-input-number v-model="form.totalCount" :min="0" />
          <span style="color:#999;font-size:12px;margin-left:8px;">0表示不限</span>
        </el-form-item>
        <el-form-item label="每人限领">
          <el-input-number v-model="form.perUserLimit" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker v-model="form.startTime" type="datetime" placeholder="选择生效时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="过期时间">
          <el-date-picker v-model="form.endTime" type="datetime" placeholder="选择过期时间" style="width:100%" />
        </el-form-item>
        <el-form-item label="上架">
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
import dayjs from 'dayjs'

const loading = ref(false)
const list = ref<any[]>([])
const dialogVisible = ref(false)
const editing = ref(false)
const form = reactive({
  id: 0, name: '', type: 'FIXED', discountValue: 10, minAmount: 0,
  totalCount: 0, perUserLimit: 1, startTime: null, endTime: null, isEnabled: true,
})

onMounted(loadData)

async function loadData() {
  loading.value = true
  try {
    const res: any = await request.get('/coupons/admin/list')
    list.value = Array.isArray(res) ? res : []
  } catch (e) {
    list.value = []
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = false
  Object.assign(form, {
    id: 0, name: '', type: 'FIXED', discountValue: 10, minAmount: 0,
    totalCount: 0, perUserLimit: 1, startTime: null, endTime: null, isEnabled: true,
  })
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
      await request.put(`/coupons/admin/${form.id}`, form)
      ElMessage.success('更新成功')
    } else {
      await request.post('/coupons/admin', form)
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
    await ElMessageBox.confirm(`确定删除优惠券"${row.name}"吗？`, '确认删除', { type: 'warning' })
    await request.delete(`/coupons/admin/${row.id}`)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

function typeText(t: string) { return { FIXED: '满减', DISCOUNT: '折扣', NEWBIE: '新人' }[t] || t }
function typeColor(t: string) { return { FIXED: 'primary', DISCOUNT: 'success', NEWBIE: 'warning' }[t] || '' }
function fmt(t: string) { return dayjs(t).format('MM-DD HH:mm') }
</script>

<style scoped>
.coupon-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { margin: 0; }
</style>
