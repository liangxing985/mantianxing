<template>
  <div>
    <div class="page-header">
      <span class="page-title">支付配置</span>
      <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
    </div>

    <el-card class="config-card" shadow="never">
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="font-weight:600;">ShareFlow 码支付</span>
          <el-switch v-model="paymentEnabled" active-text="已启用" inactive-text="未启用" />
        </div>
      </template>

      <el-form label-width="180px" :disabled="!paymentEnabled">
        <el-form-item label="API 根地址">
          <el-input v-model="apiBase" placeholder="http://118.25.48.22:8080/api/v1" style="max-width:500px;" />
        </el-form-item>
        <el-form-item label="支付页根地址">
          <el-input v-model="apiRoot" placeholder="http://118.25.48.22:8080" style="max-width:500px;" />
        </el-form-item>
        <el-form-item label="商户ID / AppID">
          <el-input v-model="appId" placeholder="peiwan_app_001" style="max-width:400px;" />
        </el-form-item>
        <el-form-item label="通信密钥">
          <el-input v-model="apiKey" placeholder="32位随机字符串" style="max-width:500px;" show-password />
          <div style="color:#909399;font-size:12px;margin-top:4px;">
            必须与 ShareFlow 服务器 .env 中的 API_KEYS 完全一致
          </div>
        </el-form-item>
        <el-form-item label="回调地址">
          <el-input :value="notifyUrl" readonly style="max-width:500px;" />
          <div style="color:#909399;font-size:12px;margin-top:4px;">
            请将此地址填写到 ShareFlow 后台的回调地址配置中
          </div>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header><span style="font-weight:600;">使用说明</span></template>
      <div style="color:#606266;line-height:1.8;font-size:14px;">
        <p><strong>1. 部署 ShareFlow 服务器</strong>：确保 ShareFlow 个人收款分账系统已部署并可访问。</p>
        <p><strong>2. 配置商户信息</strong>：在 ShareFlow 后台添加商户，获取 AppID 和 API Key。</p>
        <p><strong>3. 配置回调地址</strong>：在 ShareFlow 的 .env 中设置 <code>PAYMENT_NOTIFY_URL</code> 为上方回调地址。</p>
        <p><strong>4. 启用支付</strong>：打开上方开关，保存配置后老板端即可使用充值功能。</p>
        <p><strong>5. 测试支付</strong>：在老板端 → 我的钱包 → 充值星石，选择金额扫码支付，管理员在 ShareFlow 后台确认收款后自动到账。</p>
      </div>
    </el-card>

    <el-card class="config-card" shadow="never" style="margin-top:16px;">
      <template #header><span style="font-weight:600;">充值订单统计</span></template>
      <el-row :gutter="16">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">今日充值笔数</div>
            <div class="stat-value">{{ stats.todayCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">今日充值金额</div>
            <div class="stat-value">¥{{ stats.todayAmount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">累计充值笔数</div>
            <div class="stat-value">{{ stats.totalCount }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-label">累计充值金额</div>
            <div class="stat-value">¥{{ stats.totalAmount }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const paymentEnabled = ref(false)
const apiBase = ref('')
const apiRoot = ref('')
const appId = ref('')
const apiKey = ref('')
const saving = ref(false)
const stats = ref({ todayCount: 0, todayAmount: '0.00', totalCount: 0, totalAmount: '0.00' })

const notifyUrl = computed(() => {
  return `${window.location.origin}/api/payment/notify`
})

const loadConfig = async () => {
  try {
    const res: any = await request.get('/system-config')
    paymentEnabled.value = res.payment_enabled === 'true'
    apiBase.value = res.payment_shareflow_api_base || ''
    apiRoot.value = res.payment_shareflow_api_root || ''
    appId.value = res.payment_shareflow_app_id || ''
    apiKey.value = res.payment_shareflow_api_key || ''
  } catch (e) {
    ElMessage.error('加载配置失败')
  }
}

const saveConfig = async () => {
  if (paymentEnabled.value) {
    if (!apiBase.value) { ElMessage.warning('请填写API根地址'); return }
    if (!appId.value) { ElMessage.warning('请填写商户ID'); return }
    if (!apiKey.value) { ElMessage.warning('请填写通信密钥'); return }
  }
  saving.value = true
  try {
    await request.put('/system-config', {
      items: [
        { key: 'payment_enabled', value: String(paymentEnabled.value) },
        { key: 'payment_shareflow_api_base', value: apiBase.value },
        { key: 'payment_shareflow_api_root', value: apiRoot.value },
        { key: 'payment_shareflow_app_id', value: appId.value },
        { key: 'payment_shareflow_api_key', value: apiKey.value },
      ],
    })
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const loadStats = async () => {
  try {
    const res: any = await request.get('/payment/admin/stats')
    stats.value = res
  } catch (e) {
    // 统计接口可能不存在，忽略
  }
}

onMounted(() => {
  loadConfig()
  loadStats()
})
</script>

<style scoped>
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}
.config-card {
  border-radius: 8px;
}
.stat-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #6c5ce7;
}
</style>
