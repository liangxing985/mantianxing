<template>
  <div>
    <div class="page-header">
      <span class="page-title">系统设置</span>
      <el-button type="primary" @click="saveConfig" :loading="saving">保存设置</el-button>
    </div>

    <el-card class="config-card" shadow="never">
      <template #header><span style="font-weight:600;">财务配置</span></template>
      <el-form label-width="160px">
        <el-form-item label="平台抽成比例">
          <el-input-number v-model="feeRate" :min="0" :max="100" :step="1" />
          <span style="margin-left:8px;color:#909399;">%</span>
        </el-form-item>
        <el-form-item label="星石兑换比例">
          <el-input-number v-model="coinRate" :min="1" :max="1000" :step="1" />
          <span style="margin-left:8px;color:#909399;">星石 / 1元（即1元=多少星石）</span>
        </el-form-item>
        <el-form-item label="最低提现金额">
          <el-input-number v-model="minWithdraw" :min="1" :step="10" />
          <span style="margin-left:8px;color:#909399;">星石</span>
        </el-form-item>
        <el-form-item label="提现手续费">
          <el-input-number v-model="withdrawFee" :min="0" :max="100" :step="1" />
          <span style="margin-left:8px;color:#909399;">%</span>
        </el-form-item>
        <el-form-item label="订单过期时间">
          <el-input-number v-model="orderExpire" :min="1" :max="72" :step="1" />
          <span style="margin-left:8px;color:#909399;">小时</span>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header><span style="font-weight:600;">老板端主题配置</span></template>
      <el-form label-width="160px">
        <el-form-item label="主色调">
          <el-color-picker v-model="theme.primaryColor" />
          <span style="margin-left:8px;color:#909399;font-size:12px;">页面主色/导航栏</span>
        </el-form-item>
        <el-form-item label="强调色">
          <el-color-picker v-model="theme.accentColor" />
          <span style="margin-left:8px;color:#909399;font-size:12px;">按钮/高亮</span>
        </el-form-item>
        <el-form-item label="背景色">
          <el-color-picker v-model="theme.bgColor" />
          <span style="margin-left:8px;color:#909399;font-size:12px;">页面背景</span>
        </el-form-item>
        <el-form-item label="预览">
          <div class="theme-preview">
            <div class="preview-box" :style="{ background: theme.primaryColor }">主色</div>
            <div class="preview-box" :style="{ background: theme.accentColor }">强调</div>
            <div class="preview-box preview-bg" :style="{ background: theme.bgColor }">背景</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">段位配置</span>
          <el-button size="small" type="primary" @click="addRank">添加段位</el-button>
        </div>
      </template>
      <el-form label-width="160px">
        <el-form-item label="段位列表">
          <div style="width:100%;">
            <div v-for="(rank, idx) in rankOptions" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
              <el-input v-model="rankOptions[idx]" placeholder="段位名称，如：王者" style="flex:1;" />
              <el-button size="small" type="danger" @click="removeRank(idx)" :disabled="rankOptions.length<=1">删除</el-button>
            </div>
            <div style="color:#909399;font-size:12px;">段位将按列表顺序显示在陪玩资料和老板端</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">计价单位管理</span>
          <el-button size="small" type="primary" @click="addUnit">添加单位</el-button>
        </div>
      </template>
      <el-form label-width="160px">
        <el-form-item label="单位列表">
          <div style="width:100%;">
            <div v-for="(unit, idx) in unitOptions" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
              <el-input v-model="unitOptions[idx].label" placeholder="显示名称，如：按小时" style="flex:1;" />
              <el-input v-model="unitOptions[idx].value" placeholder="值，如：hour" style="width:140px;" />
              <el-button size="small" type="danger" @click="removeUnit(idx)" :disabled="unitOptions.length<=1">删除</el-button>
            </div>
            <div style="color:#909399;font-size:12px;">计价单位用于服务项目和订单，值为英文标识，名称为显示文字</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">游戏分类管理</span>
          <el-button size="small" type="primary" @click="addCategory">添加分类</el-button>
        </div>
      </template>
      <el-form label-width="160px">
        <el-form-item label="分类列表">
          <div style="width:100%;">
            <div v-for="(cat, idx) in categoryOptions" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
              <el-input v-model="categoryOptions[idx]" placeholder="分类名称，如：MOBA竞技" style="flex:1;" />
              <el-button size="small" type="danger" @click="removeCategory(idx)" :disabled="categoryOptions.length<=1">删除</el-button>
            </div>
            <div style="color:#909399;font-size:12px;">游戏分类用于在游戏管理中对游戏进行归类</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">商品分类管理</span>
          <el-button size="small" type="primary" @click="addProductCategory">添加分类</el-button>
        </div>
      </template>
      <el-form label-width="160px">
        <el-form-item label="分类列表">
          <div style="width:100%;">
            <div v-for="(cat, idx) in productCategoryOptions" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
              <el-input v-model="productCategoryOptions[idx].label" placeholder="显示名称，如：热门" style="flex:1;" />
              <el-input v-model="productCategoryOptions[idx].value" placeholder="值，如：hot" style="width:140px;" />
              <el-button size="small" type="danger" @click="removeProductCategory(idx)" :disabled="productCategoryOptions.length<=1">删除</el-button>
            </div>
            <div style="color:#909399;font-size:12px;">商品分类用于商品管理和老板端商品展示</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">下单时长选项</span>
          <el-button size="small" type="primary" @click="addDuration">添加时长</el-button>
        </div>
      </template>
      <el-form label-width="160px">
        <el-form-item label="时长列表">
          <div style="width:100%;">
            <div v-for="(d, idx) in durationOptions" :key="idx" style="display:flex;gap:8px;margin-bottom:8px;align-items:center;">
              <el-input v-model="durationOptions[idx].label" placeholder="显示名称，如：1小时" style="flex:1;" />
              <el-input-number v-model="durationOptions[idx].value" :min="0.5" :step="0.5" style="width:140px;" placeholder="小时数" />
              <el-button size="small" type="danger" @click="removeDuration(idx)" :disabled="durationOptions.length<=1">删除</el-button>
            </div>
            <div style="color:#909399;font-size:12px;">老板端下单时的时长可选选项，值为小时数</div>
          </div>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getSystemConfig, updateSystemConfig } from '@/api'

const saving = ref(false)
const feeRate = ref(20)
const coinRate = ref(10)
const minWithdraw = ref(100)
const withdrawFee = ref(5)
const orderExpire = ref(2)
const theme = reactive({ primaryColor: '#1a1a2e', accentColor: '#e94560', bgColor: '#0f0f1a' })
const rankOptions = ref<string[]>(['王者', '星耀', '钻石', '铂金', '黄金', '白银', '青铜'])
const unitOptions = ref<{label: string, value: string}[]>([
  { label: '按小时', value: 'hour' },
  { label: '按局', value: 'game' },
  { label: '包段', value: 'package' },
])
const categoryOptions = ref<string[]>(['MOBA竞技', '射击游戏', '手游', '休闲娱乐'])
const productCategoryOptions = ref<{label: string, value: string}[]>([
  { label: '普通', value: 'normal' },
  { label: '热门', value: 'hot' },
  { label: '折扣', value: 'discount' },
])
const durationOptions = ref<{label: string, value: number}[]>([
  { label: '1小时', value: 1 },
  { label: '2小时', value: 2 },
  { label: '3小时', value: 3 },
  { label: '5小时', value: 5 },
  { label: '包夜(8小时)', value: 8 },
])

const addRank = () => { rankOptions.value.push('') }
const removeRank = (idx: number) => { rankOptions.value.splice(idx, 1) }
const addUnit = () => { unitOptions.value.push({ label: '', value: '' }) }
const removeUnit = (idx: number) => { unitOptions.value.splice(idx, 1) }
const addCategory = () => { categoryOptions.value.push('') }
const removeCategory = (idx: number) => { categoryOptions.value.splice(idx, 1) }
const addProductCategory = () => { productCategoryOptions.value.push({ label: '', value: '' }) }
const removeProductCategory = (idx: number) => { productCategoryOptions.value.splice(idx, 1) }
const addDuration = () => { durationOptions.value.push({ label: '', value: 1 }) }
const removeDuration = (idx: number) => { durationOptions.value.splice(idx, 1) }

const loadConfig = async () => {
  const res: any = await getSystemConfig()
  const data = res.data || res
  feeRate.value = Number(data.platform_fee_rate) || 20
  coinRate.value = Number(data.coin_exchange_rate) || 10
  minWithdraw.value = Number(data.min_withdraw) || 100
  withdrawFee.value = Number(data.withdraw_fee_rate) || 5
  orderExpire.value = Number(data.order_expire_hours) || 2
  if (data.client_theme) {
    try {
      const t = JSON.parse(data.client_theme)
      Object.assign(theme, t)
    } catch {}
  }
  if (data.rank_options) {
    try {
      const arr = JSON.parse(data.rank_options)
      if (Array.isArray(arr) && arr.length > 0) {
        rankOptions.value = arr.filter((r: string) => r && r.trim())
      }
    } catch {}
  }
  if (data.unit_options) {
    try {
      const arr = JSON.parse(data.unit_options)
      if (Array.isArray(arr) && arr.length > 0) {
        unitOptions.value = arr.filter((u: any) => u && u.label && u.value)
      }
    } catch {}
  }
  if (data.game_categories) {
    try {
      const arr = JSON.parse(data.game_categories)
      if (Array.isArray(arr) && arr.length > 0) {
        categoryOptions.value = arr.filter((c: string) => c && c.trim())
      }
    } catch {}
  }
  if (data.product_categories) {
    try {
      const arr = JSON.parse(data.product_categories)
      if (Array.isArray(arr) && arr.length > 0) {
        productCategoryOptions.value = arr.filter((c: any) => c && c.label && c.value)
      }
    } catch {}
  }
  if (data.duration_options) {
    try {
      const arr = JSON.parse(data.duration_options)
      if (Array.isArray(arr) && arr.length > 0) {
        durationOptions.value = arr.filter((d: any) => d && d.label && d.value > 0)
      }
    } catch {}
  }
}

const saveConfig = async () => {
  saving.value = true
  try {
    const items = [
      { key: 'platform_fee_rate', value: String(feeRate.value) },
      { key: 'coin_exchange_rate', value: String(coinRate.value) },
      { key: 'min_withdraw', value: String(minWithdraw.value) },
      { key: 'withdraw_fee_rate', value: String(withdrawFee.value) },
      { key: 'order_expire_hours', value: String(orderExpire.value) },
      { key: 'client_theme', value: JSON.stringify(theme) },
      { key: 'rank_options', value: JSON.stringify(rankOptions.value.filter(r => r && r.trim())) },
      { key: 'unit_options', value: JSON.stringify(unitOptions.value.filter(u => u && u.label && u.value)) },
      { key: 'game_categories', value: JSON.stringify(categoryOptions.value.filter(c => c && c.trim())) },
      { key: 'product_categories', value: JSON.stringify(productCategoryOptions.value.filter(c => c && c.label && c.value)) },
      { key: 'duration_options', value: JSON.stringify(durationOptions.value.filter(d => d && d.label && d.value > 0)) },
    ]
    await updateSystemConfig(items)
    ElMessage.success('设置已保存')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadConfig)
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; }
.config-card { border-radius: 8px; }
.theme-preview { display: flex; gap: 12px; align-items: center; }
.preview-box { width: 60px; height: 36px; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 12px; }
.preview-bg { border: 1px solid #ddd; color: #333; }
</style>
