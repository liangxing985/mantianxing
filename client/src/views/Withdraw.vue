<template>
  <div class="withdraw-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">申请提现</h1>
    </div>

    <div class="withdraw-content">
      <!-- 左侧：表单 -->
      <div class="form-section">
        <!-- 余额卡片 -->
        <div class="balance-card">
          <div class="balance-label">可提现余额</div>
          <div class="balance">{{ wallet?.balance || 0 }} <span class="unit">星石</span></div>
          <div class="balance-yuan">≈ {{ ((wallet?.balance || 0) / coinRate).toFixed(2) }} 元</div>
        </div>

        <!-- 表单 -->
        <div class="card">
          <h3 class="card-title">提现信息</h3>
          <div class="form-row">
            <label class="form-label">提现金额</label>
            <div class="input-with-btn">
              <input
                type="number"
                class="form-input"
                v-model="amount"
                placeholder="请输入提现星石数量"
                min="1"
              />
              <button class="all-btn" @click="setAll">全部</button>
            </div>
          </div>
          <div class="form-row">
            <label class="form-label">收款方式</label>
            <select class="form-select" v-model="payMethod">
              <option value="">请选择收款方式</option>
              <option value="wechat">微信</option>
              <option value="alipay">支付宝</option>
              <option value="bank">银行卡</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">收款账号</label>
            <input
              type="text"
              class="form-input"
              v-model="payAccount"
              placeholder="请输入收款账号"
            />
          </div>
          <div class="form-row">
            <label class="form-label">收款人</label>
            <input
              type="text"
              class="form-input"
              v-model="payName"
              placeholder="请输入收款人姓名"
            />
          </div>
        </div>

        <!-- 费用说明 -->
        <div class="fee-card">
          <div class="fee-row">
            <span>最低提现</span>
            <span>{{ minWithdraw }} 星石（{{ (minWithdraw / coinRate).toFixed(1) }}元）</span>
          </div>
          <div class="fee-row">
            <span>手续费</span>
            <span>{{ withdrawFeeRate }}%（最低1星石）</span>
          </div>
          <div v-if="Number(amount) > 0" class="fee-row highlight">
            <span>预计到账</span>
            <span>{{ realAmount }} 星石（{{ (realAmount / coinRate).toFixed(2) }}元）</span>
          </div>
        </div>

        <button class="submit-btn" :disabled="submitting" @click="submit">
          <span v-if="submitting">提交中...</span>
          <span v-else>确认提现</span>
        </button>
      </div>

      <!-- 右侧：提现记录 -->
      <div class="records-section">
        <div class="card">
          <h3 class="card-title">提现记录</h3>
          <div v-if="records.length === 0 && !loading" class="empty">暂无提现记录</div>
          <div v-for="item in records" :key="item.id" class="record-item">
            <div class="record-left">
              <div class="record-amount">-{{ item.amount }} 星石</div>
              <div class="record-time">{{ formatTime(item.createdAt) }}</div>
              <div class="record-account">{{ payMethodText(item.payMethod) }} {{ item.payAccount }}</div>
            </div>
            <div class="record-right">
              <span class="status-tag" :class="statusClass(item.status)">{{ statusText(item.status) }}</span>
            </div>
          </div>
          <div v-if="loading" class="loading-text">加载中...</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getWallet, createWithdraw, getWithdrawList, getPublicConfig } from '@/api'
import dayjs from 'dayjs'

const wallet = ref<any>(null)
const amount = ref('')
const payMethod = ref('')
const payAccount = ref('')
const payName = ref('')
const submitting = ref(false)
const coinRate = ref(10)
const minWithdraw = ref(100)
const withdrawFeeRate = ref(5)

const records = ref<any[]>([])
const loading = ref(false)

const realAmount = computed(() => {
  const amt = Number(amount.value) || 0
  if (amt <= 0) return 0
  const fee = Math.max(1, Math.floor(amt * withdrawFeeRate.value / 100))
  return amt - fee
})

const setAll = () => {
  amount.value = String(wallet.value?.balance || 0)
}

const payMethodText = (m: string) => ({ wechat: '微信', alipay: '支付宝', bank: '银行卡' }[m] || m)

const statusText = (s: string) => ({
  PENDING: '审核中', APPROVED: '已通过', REJECTED: '已拒绝', COMPLETED: '已打款',
}[s] || s)

const statusClass = (s: string) => ({
  PENDING: 'warning', APPROVED: 'primary', REJECTED: 'danger', COMPLETED: 'success',
}[s] || 'default')

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

const loadConfig = async () => {
  try {
    const res: any = await getPublicConfig()
    if (res.coinExchangeRate) coinRate.value = res.coinExchangeRate
    if (res.minWithdraw) minWithdraw.value = res.minWithdraw
    if (res.withdrawFeeRate) withdrawFeeRate.value = res.withdrawFeeRate
  } catch (e) {}
}

const loadWallet = async () => {
  wallet.value = await getWallet()
}

const loadRecords = async () => {
  loading.value = true
  try {
    const res: any = await getWithdrawList({ page: 1, pageSize: 20 })
    records.value = res.list || []
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  const amt = Number(amount.value)
  if (!amt || amt <= 0) { alert('请输入提现金额'); return }
  if (amt < minWithdraw.value) { alert(`最低提现${minWithdraw.value}星石`); return }
  if (amt > (wallet.value?.balance || 0)) { alert('余额不足'); return }
  if (!payMethod.value) { alert('请选择收款方式'); return }
  if (!payAccount.value) { alert('请输入收款账号'); return }
  if (!payName.value) { alert('请输入收款人姓名'); return }

  if (!confirm(`确认提现${amt}星石，扣除手续费${Math.max(1, Math.floor(amt * withdrawFeeRate.value / 100))}星石，实际到账${realAmount.value}星石？`)) return

  submitting.value = true
  try {
    await createWithdraw({ amount: amt, payMethod: payMethod.value, payAccount: payAccount.value, payName: payName.value })
    alert('提现申请已提交')
    amount.value = ''
    payAccount.value = ''
    payName.value = ''
    await Promise.all([loadWallet(), loadRecords()])
  } catch (e: any) {
    alert(e?.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { loadConfig(); loadWallet(); loadRecords() })
</script>

<style scoped>
.withdraw-page {
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
  transition: background 0.2s;
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

.withdraw-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  align-items: start;
}

.balance-card {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 16px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.9;
}

.balance {
  font-size: 40px;
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
  margin-bottom: 16px;
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

.form-row {
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input, .form-select {
  width: 100%;
  padding: 12px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  outline: none;
  box-sizing: border-box;
}

.form-input:focus, .form-select:focus {
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108,92,231,0.1);
}

.input-with-btn {
  display: flex;
  gap: 8px;
}

.input-with-btn .form-input {
  flex: 1;
}

.all-btn {
  padding: 0 16px;
  background: #f5f3ff;
  color: #6c5ce7;
  border: 1px solid #6c5ce7;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.all-btn:hover {
  background: #6c5ce7;
  color: #fff;
}

.fee-card {
  background: #fff;
  border-radius: 12px;
  padding: 16px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.fee-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 13px;
  color: #999;
}

.fee-row.highlight {
  color: #f5222d;
  font-weight: 600;
  font-size: 15px;
  border-top: 1px dashed #f0f0f0;
  margin-top: 8px;
  padding-top: 12px;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(108,92,231,0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 提现记录 */
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

.record-amount {
  font-size: 16px;
  font-weight: 600;
  color: #f5222d;
}

.record-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.record-account {
  font-size: 12px;
  color: #666;
  margin-top: 2px;
}

.status-tag {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.warning {
  background: #fff7e6;
  color: #fa8c16;
}

.status-tag.primary {
  background: #e6f7ff;
  color: #1890ff;
}

.status-tag.danger {
  background: #fff1f0;
  color: #f5222d;
}

.status-tag.success {
  background: #f6ffed;
  color: #52c41a;
}

.status-tag.default {
  background: #f5f5f5;
  color: #999;
}

.empty, .loading-text {
  text-align: center;
  color: #999;
  padding: 32px 0;
  font-size: 14px;
}

@media (max-width: 900px) {
  .withdraw-content {
    grid-template-columns: 1fr;
  }
}
</style>
