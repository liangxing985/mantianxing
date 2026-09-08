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

const addRank = () => {
  rankOptions.value.push('')
}
const removeRank = (idx: number) => {
  rankOptions.value.splice(idx, 1)
}

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
