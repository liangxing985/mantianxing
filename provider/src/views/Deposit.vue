<template>
  <div class="deposit-page">
    <div class="header">
      <div class="title">保证金</div>
      <div class="balance">{{ deposit.balance || 0 }} <span>星石</span></div>
      <div class="desc">缴纳保证金可提升接单优先级和信任度</div>
    </div>
    <div class="actions">
      <button class="btn pay" @click="showPay = true">缴纳保证金</button>
      <button class="btn refund" @click="showRefund = true">申请退还</button>
    </div>
    <div class="section">
      <div class="section-title">保证金记录</div>
      <div v-if="deposit.records?.length === 0" class="empty">暂无记录</div>
      <div v-for="r in deposit.records" :key="r.id" class="record">
        <div class="info">
          <div class="type">{{ typeText(r.type) }}</div>
          <div class="time">{{ formatDate(r.createdAt) }}</div>
        </div>
        <div :class="['amount', r.type === 'DEPOSIT' || r.type === 'REFUND' ? 'positive' : 'negative']">
          {{ r.type === 'DEPOSIT' || r.type === 'REFUND' ? '+' : '-' }}{{ r.amount }}
        </div>
      </div>
    </div>

    <!-- 缴纳弹窗 -->
    <div v-if="showPay" class="modal" @click.self="showPay = false">
      <div class="modal-content">
        <div class="modal-title">缴纳保证金</div>
        <div class="amount-input">
          <input v-model.number="payAmount" type="number" placeholder="输入金额" />
          <span>星石</span>
        </div>
        <div class="quick-amounts">
          <span v-for="a in [100, 500, 1000, 5000]" :key="a" @click="payAmount = a">{{ a }}</span>
        </div>
        <div class="modal-actions">
          <button @click="showPay = false">取消</button>
          <button class="confirm" @click="doPay">确认缴纳</button>
        </div>
      </div>
    </div>

    <!-- 退还弹窗 -->
    <div v-if="showRefund" class="modal" @click.self="showRefund = false">
      <div class="modal-content">
        <div class="modal-title">申请退还保证金</div>
        <div class="amount-input">
          <input v-model.number="refundAmount" type="number" placeholder="输入金额" />
          <span>星石</span>
        </div>
        <div class="tip">有进行中订单时暂不能退还</div>
        <div class="modal-actions">
          <button @click="showRefund = false">取消</button>
          <button class="confirm" @click="doRefund">确认退还</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { showToast } from 'vant'

const deposit = ref<any>({ balance: 0, records: [] })
const showPay = ref(false)
const showRefund = ref(false)
const payAmount = ref(100)
const refundAmount = ref(100)

onMounted(loadDeposit)

async function loadDeposit() {
  const res = await request.get('/deposit/my')
  deposit.value = res.data || res
}

function typeText(type: string) {
  const map: any = { DEPOSIT: '缴纳', REFUND: '退还', FREEZE: '冻结', UNFREEZE: '解冻', DEDUCT: '扣除' }
  return map[type] || type
}

function formatDate(d: any) {
  return new Date(d).toLocaleString()
}

async function doPay() {
  if (!payAmount.value || payAmount.value <= 0) return showToast('请输入金额')
  try {
    await request.post('/deposit/pay', { amount: payAmount.value })
    showToast('缴纳成功')
    showPay.value = false
    loadDeposit()
  } catch (e: any) {
    showToast(e.response?.data?.message || '缴纳失败')
  }
}

async function doRefund() {
  if (!refundAmount.value || refundAmount.value <= 0) return showToast('请输入金额')
  try {
    await request.post('/deposit/refund', { amount: refundAmount.value })
    showToast('退还成功')
    showRefund.value = false
    loadDeposit()
  } catch (e: any) {
    showToast(e.response?.data?.message || '退还失败')
  }
}
</script>

<style scoped>
.deposit-page { min-height: 100vh; background: #f5f5f5; }
.header { background: linear-gradient(135deg, #1677ff, #69b1ff); padding: 40px 20px; text-align: center; color: #fff; }
.title { font-size: 16px; opacity: 0.9; }
.balance { font-size: 36px; font-weight: 700; margin: 10px 0; }
.balance span { font-size: 14px; font-weight: 400; }
.desc { font-size: 12px; opacity: 0.8; }
.actions { display: flex; gap: 12px; padding: 16px; }
.btn { flex: 1; padding: 12px; border: none; border-radius: 8px; font-size: 15px; cursor: pointer; }
.btn.pay { background: #1677ff; color: #fff; }
.btn.refund { background: #fff; color: #1677ff; border: 1px solid #1677ff; }
.section { background: #fff; margin: 0 16px 16px; border-radius: 12px; padding: 16px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.record { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f5f5f5; }
.record:last-child { border-bottom: none; }
.type { font-size: 14px; }
.time { font-size: 11px; color: #999; margin-top: 2px; }
.amount.positive { color: #52c41a; }
.amount.negative { color: #ff4d4f; }
.empty { text-align: center; color: #ccc; padding: 20px 0; }
.modal { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
.modal-content { background: #fff; border-radius: 12px; padding: 24px; width: 80%; max-width: 320px; }
.modal-title { font-size: 17px; font-weight: 600; text-align: center; margin-bottom: 20px; }
.amount-input { display: flex; align-items: center; border: 1px solid #ddd; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
.amount-input input { flex: 1; border: none; outline: none; font-size: 18px; }
.quick-amounts { display: flex; gap: 8px; margin-bottom: 16px; }
.quick-amounts span { padding: 6px 12px; background: #f5f5f5; border-radius: 6px; font-size: 13px; cursor: pointer; }
.tip { font-size: 12px; color: #999; margin-bottom: 16px; }
.modal-actions { display: flex; gap: 12px; }
.modal-actions button { flex: 1; padding: 10px; border: 1px solid #ddd; background: #fff; border-radius: 8px; cursor: pointer; }
.modal-actions .confirm { background: #1677ff; color: #fff; border-color: #1677ff; }
</style>
