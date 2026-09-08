<template>
  <div class="wallet-page">
    <div class="wallet-header">
      <div class="balance-label">可提现星石</div>
      <div class="balance">{{ wallet?.balance || 0 }}</div>
      <div class="frozen">冻结中: {{ wallet?.frozen || 0 }} 星石</div>
      <div class="actions">
        <van-button round size="small" type="primary" @click="showWithdraw = true">申请提现</van-button>
      </div>
    </div>
    <div class="section">
      <div class="section-title">收入明细</div>
      <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData">
        <div v-for="tx in list" :key="tx.id" class="tx-item">
          <div class="tx-left">
            <div class="tx-type">{{ typeText(tx.type) }}</div>
            <div class="tx-time">{{ formatTime(tx.createdAt) }}</div>
          </div>
          <div class="tx-amount" :class="{ positive: tx.amount > 0, negative: tx.amount < 0 }">
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
          </div>
        </div>
      </van-list>
    </div>
    <!-- 提现弹窗 -->
    <van-popup v-model:show="showWithdraw" position="bottom" round>
      <div class="withdraw-form">
        <h3>申请提现</h3>
        <p class="tip">最低提现{{ minWithdraw }}星石（{{ (minWithdraw / coinRate).toFixed(1) }}元），手续费{{ withdrawFeeRate }}%</p>
        <van-field v-model="withdrawForm.amount" type="digit" label="提现星石" placeholder="请输入" />
        <van-field label="到账金额">
          <template #input><span style="color: #00b894; font-weight: 600;">{{ realAmount }} 元</span></template>
        </van-field>
        <van-field label="收款方式" is-link readonly :model-value="payMethodText" @click="showPayPicker = true" />
        <van-field v-model="withdrawForm.payName" label="真实姓名" placeholder="请输入" />
        <van-field v-model="withdrawForm.payAccount" label="收款账号" placeholder="支付宝/微信/银行卡号" />
        <van-button type="primary" block round style="margin-top: 16px;" @click="submitWithdraw">提交申请</van-button>
      </div>
    </van-popup>
    <van-popup v-model:show="showPayPicker" position="bottom" round>
      <van-picker :columns="payOptions" @confirm="onPayConfirm" @cancel="showPayPicker = false" />
    </van-popup>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { getWallet, getTransactions, createWithdraw, getPublicConfig } from '@/api'
import dayjs from 'dayjs'
const wallet = ref<any>(null); const list = ref<any[]>([])
const loading = ref(false); const finished = ref(false); const page = ref(1)
const showWithdraw = ref(false); const showPayPicker = ref(false)
const minWithdraw = ref(100)
const withdrawFeeRate = ref(5)
const coinRate = ref(10)
const withdrawForm = reactive({ amount: 100, payMethod: 'alipay', payName: '', payAccount: '' })
const payOptions = [{ text: '支付宝', value: 'alipay' }, { text: '微信', value: 'wechat' }, { text: '银行卡', value: 'bank' }]
const payMethodText = computed(() => payOptions.find(o => o.value === withdrawForm.payMethod)?.text)
const realAmount = computed(() => {
  const amount = Number(withdrawForm.amount) || 0
  const fee = Math.max(1, Math.round(amount * withdrawFeeRate.value / 100))
  return ((amount - fee) / coinRate.value).toFixed(2)
})
const loadConfig = async () => {
  try {
    const res: any = await getPublicConfig()
    if (res.minWithdraw) minWithdraw.value = res.minWithdraw
    if (res.withdrawFeeRate !== undefined) withdrawFeeRate.value = res.withdrawFeeRate
    if (res.coinExchangeRate) coinRate.value = res.coinExchangeRate
    withdrawForm.amount = minWithdraw.value
  } catch (e) {}
}
const loadWallet = async () => { wallet.value = await getWallet() }
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getTransactions({ page: page.value, pageSize: 20, type: 'INCOME' })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total; page.value++
  } finally { loading.value = false }
}
const onPayConfirm = ({ selectedOptions }: any) => { withdrawForm.payMethod = selectedOptions[0].value; showPayPicker.value = false }
const submitWithdraw = async () => {
  if (withdrawForm.amount < minWithdraw.value) { showToast(`最低提现${minWithdraw.value}星石`); return }
  if (!withdrawForm.payName || !withdrawForm.payAccount) { showToast('请填写收款信息'); return }
  await createWithdraw(withdrawForm)
  showSuccessToast('提现申请已提交')
  showWithdraw.value = false
  loadWallet()
}
const typeText = (t: string) => ({ INCOME: '订单收入', WITHDRAW: '提现', WITHDRAW_REFUND: '提现退回', ADJUST: '调整' }[t] || t)
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')
onMounted(() => { loadConfig(); loadWallet(); loadData() })
</script>
<style scoped>
.wallet-header { background: linear-gradient(135deg, #00b894, #55efc4); color: #fff; padding: 30px 20px; text-align: center; }
.balance-label { font-size: 14px; opacity: 0.9; }
.balance { font-size: 40px; font-weight: 700; margin: 8px 0; }
.frozen { font-size: 12px; opacity: 0.8; margin-bottom: 16px; }
.section { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.tx-item { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.tx-type { font-size: 14px; }
.tx-time { font-size: 12px; color: #999; margin-top: 2px; }
.tx-amount { font-size: 16px; font-weight: 600; }
.tx-amount.positive { color: #00b894; }
.tx-amount.negative { color: #f5576c; }
.withdraw-form { padding: 20px; }
.withdraw-form h3 { font-size: 18px; margin-bottom: 8px; }
.tip { font-size: 13px; color: #999; margin-bottom: 16px; }
</style>
