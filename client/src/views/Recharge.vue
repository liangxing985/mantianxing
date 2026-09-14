<template>
  <div class="recharge-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">星石充值</h1>
    </div>

    <div class="recharge-content">
      <!-- 左侧：金额选择 -->
      <div class="amount-section">
        <div class="balance-card">
          <div class="balance-label">当前余额</div>
          <div class="balance">{{ wallet?.balance || 0 }} <span class="unit">星石</span></div>
          <div class="balance-yuan">≈ {{ ((wallet?.balance || 0) / coinRate).toFixed(2) }} 元</div>
        </div>

        <div class="card">
          <h3 class="card-title">选择充值金额</h3>
          <div class="amount-grid">
            <div
              v-for="item in presetAmounts"
              :key="item.yuan"
              class="amount-item"
              :class="{ active: selectedAmount === item.yuan }"
              @click="selectAmount(item.yuan)"
            >
              <div class="amount-yuan">{{ item.yuan }}元</div>
              <div class="amount-coin">{{ item.coin }}星石</div>
            </div>
          </div>
          <div class="custom-amount">
            <input
              type="number"
              class="custom-input"
              v-model="customAmount"
              placeholder="自定义金额（元）"
              min="1"
              @input="onCustomInput"
            />
            <span class="custom-coin" v-if="customAmount && Number(customAmount) > 0">
              = {{ Math.floor(Number(customAmount) * coinRate) }}星石
            </span>
          </div>
        </div>

        <button class="pay-btn" :disabled="!canPay || creating" @click="createOrder">
          <span v-if="creating">创建中...</span>
          <span v-else>立即充值 {{ selectedAmount }}元</span>
        </button>
      </div>

      <!-- 右侧：二维码 -->
      <div class="qr-section">
        <div class="card qr-card" v-if="!paymentInfo">
          <div class="qr-placeholder">
            <div class="qr-icon">📱</div>
            <p>选择金额后点击"立即充值"</p>
            <p class="hint">支持微信、支付宝扫码支付</p>
          </div>
        </div>

        <div class="card qr-card" v-else>
          <h3 class="card-title">扫码支付</h3>
          <div class="pay-tabs">
            <button
              class="tab-btn"
              :class="{ active: payType === 'wechat' }"
              @click="payType = 'wechat'"
            >
              微信支付
            </button>
            <button
              class="tab-btn"
              :class="{ active: payType === 'alipay' }"
              @click="payType = 'alipay'"
            >
              支付宝
            </button>
          </div>

          <div class="qr-wrapper">
            <img
              v-if="payType === 'wechat' && paymentInfo.wechatQr"
              :src="paymentInfo.wechatQr"
              class="qr-img"
              alt="微信支付"
            />
            <img
              v-else-if="payType === 'alipay' && paymentInfo.alipayQr"
              :src="paymentInfo.alipayQr"
              class="qr-img"
              alt="支付宝"
            />
            <div v-else class="qr-error">二维码加载失败</div>
          </div>

          <div class="pay-info">
            <div class="pay-amount">
              <span>支付金额</span>
              <span class="amount-num">¥{{ paymentInfo.amount }}</span>
            </div>
            <div class="pay-coin">
              <span>到账星石</span>
              <span class="coin-num">{{ paymentInfo.coinAmount }}星石</span>
            </div>
            <div class="pay-status" :class="statusClass">
              {{ statusText }}
            </div>
          </div>

          <a
            v-if="paymentInfo.payUrl && (payStatus === 'pending_pay' || payStatus === 'pending_confirm')"
            :href="paymentInfo.payUrl"
            target="_blank"
            class="open-pay-btn"
          >
            打开支付页面
          </a>

          <button v-if="payStatus === 'expired'" class="retry-btn" @click="resetPayment">
            重新充值
          </button>
        </div>
      </div>
    </div>

    <!-- 充值记录 -->
    <div class="records-section">
      <div class="card">
        <h3 class="card-title">充值记录</h3>
        <div v-if="records.length === 0 && !loading" class="empty">暂无充值记录</div>
        <div v-for="item in records" :key="item.id" class="record-item">
          <div class="record-left">
            <div class="record-title">{{ item.productName }}</div>
            <div class="record-time">{{ formatTime(item.createdAt) }}</div>
          </div>
          <div class="record-right">
            <div class="record-amount">+{{ item.coinAmount }}星石</div>
            <div class="record-status" :class="recordStatusClass(item.payStatus)">
              {{ recordStatusText(item.payStatus) }}
            </div>
          </div>
        </div>
        <div v-if="loading" class="loading-text">加载中...</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getWallet, createRecharge, queryPaymentStatus, getRechargeList, getPublicConfig } from '@/api'
import dayjs from 'dayjs'

const wallet = ref<any>(null)
const coinRate = ref(10)
const selectedAmount = ref(0)
const customAmount = ref('')
const creating = ref(false)
const paymentInfo = ref<any>(null)
const payType = ref<'wechat' | 'alipay'>('wechat')
const payStatus = ref('')
const records = ref<any[]>([])
const loading = ref(false)
let pollTimer: any = null

const presetAmounts = [
  { yuan: 10, coin: 100 },
  { yuan: 30, coin: 300 },
  { yuan: 50, coin: 500 },
  { yuan: 100, coin: 1000 },
  { yuan: 200, coin: 2000 },
  { yuan: 500, coin: 5000 },
]

const canPay = computed(() => selectedAmount.value > 0)

const statusText = computed(() => {
  const map: Record<string, string> = {
    pending_pay: '等待扫码支付...',
    pending_confirm: '已支付，等待确认...',
    paid: '支付成功！',
    expired: '支付已过期',
  }
  return map[payStatus.value] || '等待支付...'
})

const statusClass = computed(() => ({
  success: payStatus.value === 'paid',
  warning: payStatus.value === 'pending_confirm',
  danger: payStatus.value === 'expired',
}))

const selectAmount = (yuan: number) => {
  selectedAmount.value = yuan
  customAmount.value = ''
}

const onCustomInput = () => {
  const val = Number(customAmount.value)
  if (val > 0) {
    selectedAmount.value = val
  } else {
    selectedAmount.value = 0
  }
}

const loadWallet = async () => {
  wallet.value = await getWallet()
}

const loadConfig = async () => {
  try {
    const res: any = await getPublicConfig()
    if (res.coinExchangeRate) coinRate.value = res.coinExchangeRate
  } catch (e) {}
}

const loadRecords = async () => {
  loading.value = true
  try {
    const res: any = await getRechargeList({ page: 1, pageSize: 10 })
    const recordsData = res?.data || res
    records.value = recordsData.list || []
  } finally {
    loading.value = false
  }
}

const createOrder = async () => {
  if (!canPay.value) return
  creating.value = true
  try {
    const res: any = await createRecharge(selectedAmount.value)
    console.log('=== 创建充值订单返回 ===', res)
    // 兼容两种响应结构：res.data.orderId 或 res.orderId
    const orderData = res?.data || res
    if (!orderData || !orderData.orderId) {
      alert('创建订单失败：未返回订单ID')
      return
    }
    paymentInfo.value = orderData
    payStatus.value = 'pending_pay'
    startPolling(orderData.orderId)
  } catch (e: any) {
    alert(e?.response?.data?.message || e?.message || '创建订单失败')
  } finally {
    creating.value = false
  }
}

const startPolling = (orderId: number) => {
  stopPolling()
  pollTimer = setInterval(async () => {
    try {
      const res: any = await queryPaymentStatus(orderId)
      const statusData = res?.data || res
      payStatus.value = statusData.payStatus
      if (statusData.payStatus === 'paid') {
        stopPolling()
        await loadWallet()
        await loadRecords()
      } else if (statusData.payStatus === 'expired') {
        stopPolling()
      }
    } catch (e) {}
  }, 3000)
}

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

const resetPayment = () => {
  paymentInfo.value = null
  payStatus.value = ''
  selectedAmount.value = 0
  customAmount.value = ''
}

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const recordStatusText = (s: string) => ({
  pending_pay: '待支付',
  pending_confirm: '待确认',
  paid: '已支付',
  expired: '已过期',
}[s] || s)

const recordStatusClass = (s: string) => ({
  success: s === 'paid',
  warning: s === 'pending_pay' || s === 'pending_confirm',
  danger: s === 'expired',
})

onMounted(() => {
  loadConfig()
  loadWallet()
  loadRecords()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.recharge-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #6c5ce7;
  font-size: 15px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
}

.back-btn:hover {
  background: #f5f3ff;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.recharge-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: start;
  margin-bottom: 24px;
}

.balance-card {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  padding: 28px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
}

.balance {
  font-size: 36px;
  font-weight: 700;
  margin: 8px 0;
}

.balance .unit {
  font-size: 16px;
  font-weight: 400;
}

.balance-yuan {
  font-size: 13px;
  opacity: 0.8;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.amount-item {
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  padding: 16px 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.amount-item:hover {
  border-color: #a29bfe;
}

.amount-item.active {
  border-color: #6c5ce7;
  background: #f5f3ff;
}

.amount-yuan {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.amount-coin {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.custom-amount {
  display: flex;
  align-items: center;
  gap: 12px;
}

.custom-input {
  flex: 1;
  padding: 12px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  outline: none;
}

.custom-input:focus {
  border-color: #6c5ce7;
}

.custom-coin {
  font-size: 14px;
  color: #6c5ce7;
  font-weight: 500;
  white-space: nowrap;
}

.pay-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 16px;
  transition: all 0.2s;
}

.pay-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(108,92,231,0.4);
}

.pay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 二维码区域 */
.qr-card {
  text-align: center;
}

.qr-placeholder {
  padding: 60px 20px;
  color: #999;
}

.qr-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.qr-placeholder p {
  margin: 8px 0;
  font-size: 14px;
}

.qr-placeholder .hint {
  font-size: 12px;
  color: #bbb;
}

.pay-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.tab-btn {
  flex: 1;
  padding: 10px;
  border: 1px solid #d9d9d9;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn.active {
  border-color: #6c5ce7;
  background: #f5f3ff;
  color: #6c5ce7;
  font-weight: 600;
}

.qr-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.qr-img {
  width: 220px;
  height: 220px;
  border-radius: 8px;
  border: 1px solid #eee;
}

.qr-error {
  width: 220px;
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f5;
  border-radius: 8px;
  color: #999;
  font-size: 14px;
}

.pay-info {
  text-align: left;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  margin-bottom: 16px;
}

.pay-amount, .pay-coin {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
  color: #666;
}

.amount-num {
  color: #f5222d;
  font-weight: 600;
  font-size: 18px;
}

.coin-num {
  color: #6c5ce7;
  font-weight: 600;
}

.pay-status {
  text-align: center;
  padding: 10px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  margin-top: 8px;
  background: #fff7e6;
  color: #fa8c16;
}

.pay-status.success {
  background: #f6ffed;
  color: #52c41a;
}

.pay-status.danger {
  background: #fff1f0;
  color: #f5222d;
}

.open-pay-btn {
  display: block;
  width: 100%;
  padding: 12px;
  background: #6c5ce7;
  color: #fff;
  text-align: center;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.retry-btn {
  width: 100%;
  padding: 12px;
  background: #6c5ce7;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

/* 充值记录 */
.record-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #f5f5f5;
}

.record-item:last-child {
  border-bottom: none;
}

.record-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a2e;
}

.record-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #52c41a;
  text-align: right;
}

.record-status {
  font-size: 12px;
  text-align: right;
  margin-top: 4px;
}

.record-status.success { color: #52c41a; }
.record-status.warning { color: #fa8c16; }
.record-status.danger { color: #f5222d; }

.empty, .loading-text {
  text-align: center;
  color: #999;
  padding: 32px 0;
  font-size: 14px;
}

@media (max-width: 900px) {
  .recharge-content {
    grid-template-columns: 1fr;
  }
  .amount-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
