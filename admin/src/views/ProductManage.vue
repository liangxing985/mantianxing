<template>
  <div>
    <div class="page-header">
      <span class="page-title">商品管理</span>
      <div>
        <el-input v-model="keyword" placeholder="搜索商品名称" clearable style="width:200px;margin-right:12px;" @clear="loadList" @keyup.enter="loadList" />
        <el-select v-model="category" placeholder="全部分类" clearable style="width:120px;margin-right:12px;" @change="loadList">
          <el-option v-for="c in productCategoryOptions" :key="c.value" :label="c.label" :value="c.value" />
        </el-select>
        <el-button type="primary" @click="openDialog()">新增商品</el-button>
      </div>
    </div>

    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="图片" width="80">
        <template #default="{ row }">
          <el-image v-if="row.image" :src="row.image" style="width:50px;height:50px;border-radius:4px;" fit="cover" />
          <span v-else style="color:#ccc;">无</span>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="商品名称" min-width="150" />
      <el-table-column label="所属游戏" width="100">
        <template #default="{ row }">
          {{ getGameName(row.gameId) }}
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip />
      <el-table-column label="价格" width="120">
        <template #default="{ row }">
          <span style="color:#e94560;font-weight:600;">{{ row.price }} 星石</span>
          <span v-if="row.originalPrice" style="color:#999;text-decoration:line-through;margin-left:6px;font-size:12px;">{{ row.originalPrice }}</span>
        </template>
      </el-table-column>
      <el-table-column label="分类" width="80">
        <template #default="{ row }">
          <el-tag :type="categoryTagType(row.category)" size="small">
            {{ categoryLabel(row.category) }}
          </el-tag>
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
    <el-dialog v-model="dialog" :title="form.id ? '编辑商品' : '新增商品'" width="500px">
      <el-form :model="form" label-width="90px">
        <el-form-item label="商品名称" required>
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="价格(星石)" required>
          <el-input-number v-model="form.price" :min="0" />
        </el-form-item>
        <el-form-item label="原价(星石)">
          <el-input-number v-model="form.originalPrice" :min="0" />
        </el-form-item>
        <el-form-item label="所属游戏">
          <el-select v-model="form.gameId" placeholder="请选择游戏" clearable style="width:100%;">
            <el-option v-for="g in games" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" style="width:100%;">
            <el-option v-for="c in productCategoryOptions" :key="c.value" :label="c.label" :value="c.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品图片">
          <el-upload
            :show-file-list="false"
            :before-upload="beforeUpload"
            :http-request="(opts:any)=>handleUpload(opts,'product')"
            accept="image/*"
          >
            <div v-if="form.image" class="upload-preview">
              <img :src="form.image" style="width:100px;height:100px;object-fit:cover;border-radius:4px;" />
            </div>
            <el-button v-else size="small">点击上传</el-button>
          </el-upload>
          <div style="color:#909399;font-size:12px;margin-top:4px;">建议尺寸 400x400，不超过5MB</div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="上架">
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
import { getProductList, createProduct, updateProduct, deleteProduct, toggleProduct, getGameList, uploadImage, getSystemConfig } from '@/api'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const category = ref('')
const dialog = ref(false)
const games = ref<any[]>([])
const productCategoryOptions = ref<{label: string, value: string}[]>([
  { label: '普通', value: 'normal' },
  { label: '热门', value: 'hot' },
  { label: '折扣', value: 'discount' },
])
const form = reactive({ id: null as number | null, name: '', description: '', price: 0, originalPrice: null as number | null, gameId: null as number | null, category: 'normal', image: '', sortOrder: 0, isActive: true })

const categoryLabel = (val: string) => productCategoryOptions.value.find(c => c.value === val)?.label || val || '普通'
const categoryTagType = (val: string) => {
  if (val === 'hot') return 'danger'
  if (val === 'discount') return 'warning'
  return 'info'
}

const getGameName = (gameId: number) => {
  return games.value.find(g => g.id === gameId)?.name || '通用'
}

const loadGames = async () => {
  try {
    const res: any = await getGameList()
    games.value = res.data || res || []
  } catch (e) {
    games.value = []
  }
}

const loadList = async () => {
  loading.value = true
  try {
    const res: any = await getProductList({ page: page.value, pageSize: pageSize.value, keyword: keyword.value, category: category.value })
    const data = res.data || res
    list.value = data.list || []
    total.value = data.total || 0
  } finally { loading.value = false }
}

const openDialog = (row?: any) => {
  if (row) {
    Object.assign(form, row)
  } else {
    Object.assign(form, { id: null, name: '', description: '', price: 0, originalPrice: null, gameId: null, category: 'normal', image: '', sortOrder: 0, isActive: true })
  }
  dialog.value = true
}

const save = async () => {
  if (!form.name) { ElMessage.warning('请输入商品名称'); return }
  saving.value = true
  try {
    if (form.id) {
      await updateProduct(form.id, form)
    } else {
      await createProduct(form)
    }
    ElMessage.success('保存成功')
    dialog.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

const toggle = async (row: any, v: boolean) => {
  await toggleProduct(row.id, v)
  ElMessage.success(v ? '已上架' : '已下架')
}

const remove = async (row: any) => {
  await ElMessageBox.confirm(`确定删除商品「${row.name}」？`, '确认', { type: 'warning' })
  await deleteProduct(row.id)
  ElMessage.success('已删除')
  loadList()
}

const beforeUpload = (file: File) => {
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

const handleUpload = async (opts: any, _type: string) => {
  try {
    const res: any = await uploadImage(opts.file)
    form.image = res.url || res.data?.url || ''
    ElMessage.success('上传成功')
  } catch (e) {
    ElMessage.error('上传失败')
  }
}

const loadProductCategories = async () => {
  try {
    const res: any = await getSystemConfig()
    const data = res.data || res
    if (data.product_categories) {
      try {
        const arr = JSON.parse(data.product_categories)
        if (Array.isArray(arr) && arr.length > 0) {
          productCategoryOptions.value = arr.filter((c: any) => c && c.label && c.value)
        }
      } catch {}
    }
  } catch (e) {}
}

onMounted(() => {
  loadGames()
  loadList()
  loadProductCategories()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; }
</style>
