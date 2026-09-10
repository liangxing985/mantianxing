<template>
  <div class="withdraw-page">
    <van-nav-bar title="申请提现" left-arrow @click-left="$router.back()" />

    <div class="balance-card">
      <div class="balance-label">可提现余额</div>
      <div class="balance">{{ wallet?.balance || 0 }} <span class="unit">星石</span></div>
      <div class="balance-yuan">≈ {{ (wallet?.balance || 0) / coinRate }} 元</div>
    </div>

    <div class="form-card">
      <van-field
        v-model="amount"
        type="digit"
        label="提现金额"
        placeholder="请输入提现星石数量"
        :rules="[{ required: true, message: '请输入提现金额' }]"
      >
        <template #right-icon>
          <span class="all-btn" @click="setAll">全部</span>
        </template>
      </van-field>
      <van-field
        v-model="payMethod"
        label="收款方式"
        is-link
        readonly
        placeholder="请选择收款方式"
        @click="showPayPicker = true"
      />
      <van-field
        v-model="payAccount"
        label="收款账号"
        placeholder="请输入收款账号"
        :rules="[{ required: true, message: '请输入收款账号' }]"
      />
      <van-field
        v-model="payName"
        label="收款人"
        placeholder="请输入收款人姓名"
        :rules="[{ required: true, message: '请输入收款人姓名' }]"
      />
    </div>

    <div class="fee-tip">
      <div>最低提现：{{ minWithdraw }} 星石（{{ (minWithdraw / coinRate).toFixed(1) }}元）</div>
      <div>手续费：{{ withdrawFeeRate }}%（最低1星石）</div>
      <div v-if="Number(amount) > 0">
        预计到账：{{ realAmount }} 星石（{{ (realAmount / coinRate).toFixed(2) }}元）
      </div>
    </div>

    <div class="submit-area">
      <van-button type="primary" block round :loading="submitting" @click="submit">
        确认提现
      </van-button>
    </div>

    <div class="records-section">
      <div class="section-title">提现记录</div>
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadRecords">
        <div v-for="item in records" :key="item.id" class="record-item">
          <div class="record-left">
            <div class="record-amount">-{{ item.amount }} 星石</div>
            <div class="record-time">{{ formatTime(item.createdAt) }}</div>
            <div class="record-account">{{ payMethodText(item.payMethod) }} {{ item.payAccount }}</div>
          </div>
          <div class="record-right">
            <van-tag :type="statusType(item.status)">{{ statusText(item.status) }}</van-tag>
          </div>
        </div>
        <div v-if="records.length === 0 && !loading" class="empty">暂无提现记录</div>
      </van-list>
    </div>

    <!-- 收款方式选择 -->
    <van-popup v-model:show="showPayPicker" position="bottom" round>
      <van-picker
        :columns="payMethods"
        @confirm="onPayConfirm"
        @cancel="showPayPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showToast, showConfirmDialog } from 'vant'
import { getWallet, createWithdraw, getWithdrawList, getPublicConfig } from '@/api'
import dayjs from 'dayjs'

const wallet = ref<any>(null)
const amount = ref('')
const payMethod = ref('')
const payAccount = ref('')
const payName = ref('')
const submitting = ref(false)
const showPayPicker = ref(false)
const coinRate = ref(10)
const minWithdraw = ref(100)
const withdrawFeeRate = ref(5)

const records = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)

const payMethods = [
  { text: '微信', value: 'wechat' },
  { text: '支付宝', value: 'alipay' },
  { text: '银行卡', value: 'bank' },
]

const realAmount = computed(() => {
  const amt = Number(amount.value) || 0
  if (amt <= 0) return 0
  const fee = Math.max(1, Math.floor(amt * withdrawFeeRate.value / 100))
  return amt - fee
})

const setAll = () => {
  amount.value = String(wallet.value?.balance || 0)
}

const onPayConfirm = ({ selectedOptions }: any) => {
  payMethod.value = selectedOptions[0].value
  showPayPicker.value = false
}

const payMethodText = (m: string) => ({ wechat: '微信', alipay: '支付宝', bank: '银行卡' }[m] || m)

const statusText = (s: string) => ({
  PENDING: '审核中', APPROVED: '已通过', REJECTED: '已拒绝', COMPLETED: '已打款',
}[s] || s)

const statusType = (s: string): any => ({
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
    const res: any = await getWithdrawList({ page: page.value, pageSize: 20 })
    records.value = page.value === 1 ? res.list : [...records.value, ...res.list]
    finished.value = records.value.length >= res.total
    page.value++
  } finally {
    loading.value = false
  }
}

const submit = async () => {
  const amt = Number(amount.value)
  if (!amt || amt <= 0) { showToast('请输入提现金额'); return }
  if (amt < minWithdraw.value) { showToast(`最低提现${minWithdraw.value}星石`); return }
  if (amt > (wallet.value?.balance || 0)) { showToast('余额不足'); return }
  if (!payMethod.value) { showToast('请选择收款方式'); return }
  if (!payAccount.value) { showToast('请输入收款账号'); return }
  if (!payName.value) { showToast('请输入收款人姓名'); return }

  try {
    await showConfirmDialog({
      title: '确认提现',
      message: `提现${amt}星石，扣除手续费${Math.max(1, Math.floor(amt * withdrawFeeRate.value / 100))}星石，实际到账${realAmount.value}星石`,
    })
  } catch { return }

  submitting.value = true
  try {
    await createWithdraw({ amount: amt, payMethod: payMethod.value, payAccount: payAccount.value, payName: payName.value })
    showToast('提现申请已提交')
    amount.value = ''
    payAccount.value = ''
    payName.value = ''
    page.value = 1
    records.value = []
    finished.value = false
    await Promise.all([loadWallet(), loadRecords()])
  } catch (e: any) {
    showToast(e?.response?.data?.message || '提交失败')
  } finally {
    submitting.value = false
  }
}

onMounted(() => { loadConfig(); loadWallet(); loadRecords() })
</script>

<style scoped>
.withdraw-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 20px; }
.balance-card {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff; padding: 24px 20px; text-align: center;
}
.balance-label { font-size: 13px; opacity: 0.9; }
.balance { font-size: 32px; font-weight: 700; margin: 6px 0; }
.balance .unit { font-size: 14px; font-weight: 400; }
.balance-yuan { font-size: 12px; opacity: 0.8; }
.form-card { background: #fff; margin: 12px; border-radius: 12px; overflow: hidden; }
.all-btn { color: #6c5ce7; font-size: 13px; cursor: pointer; }
.fee-tip {
  background: #fff; margin: 0 12px; border-radius: 12px;
  padding: 12px 16px; font-size: 12px; color: #999; line-height: 1.8;
}
.submit-area { padding: 16px 12px; }
.records-section { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.record-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid #f5f5f5;
}
.record-amount { font-size: 15px; font-weight: 600; color: #f5576c; }
.record-time { font-size: 12px; color: #999; margin-top: 2px; }
.record-account { font-size: 12px; color: #666; margin-top: 2px; }
.empty { text-align: center; color: #999; padding: 20px 0; font-size: 13px; }
</style>
