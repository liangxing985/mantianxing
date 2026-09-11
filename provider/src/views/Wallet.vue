<template>
  <div class="wallet-page">
    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-left">
        <div class="balance-label">可提现星石</div>
        <div class="balance-num">{{ wallet?.balance || 0 }}</div>
        <div class="balance-sub">
          <span>冻结中: {{ wallet?.frozen || 0 }} 星石</span>
          <span>≈ {{ ((wallet?.balance || 0) / coinRate).toFixed(2) }} 元</span>
        </div>
      </div>
      <div class="balance-right">
        <button class="btn btn-lg" style="background:#fff;color:var(--primary);font-weight:600;" @click="showWithdraw = true">
          申请提现
        </button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">💰</div>
        <div class="stat-info">
          <div class="stat-num">{{ totalIncome }}</div>
          <div class="stat-label">累计收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">📅</div>
        <div class="stat-info">
          <div class="stat-num">{{ todayIncome }}</div>
          <div class="stat-label">今日收入</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏦</div>
        <div class="stat-info">
          <div class="stat-num">{{ totalWithdraw }}</div>
          <div class="stat-label">累计提现</div>
        </div>
      </div>
    </div>

    <!-- 收入明细 -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">收入明细</h3>
      </div>
      <table class="table">
        <thead>
          <tr>
            <th>类型</th>
            <th>金额</th>
            <th>时间</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="tx in list" :key="tx.id">
            <td>
              <span class="tx-type">
                <span class="tx-icon">{{ txIcon(tx.type) }}</span>
                {{ typeText(tx.type) }}
              </span>
            </td>
            <td class="amount" :class="{ positive: tx.amount > 0, negative: tx.amount < 0 }">
              {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
            </td>
            <td class="time">{{ formatTime(tx.createdAt) }}</td>
            <td>{{ tx.remark || '-' }}</td>
          </tr>
        </tbody>
      </table>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="list.length === 0" class="empty-state">
        <div class="empty-icon">📝</div>
        <p>暂无收入记录</p>
      </div>
      
      <div v-if="!finished && list.length > 0" class="load-more">
        <button class="btn btn-outline" @click="loadData" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 提现弹窗 -->
    <div v-if="showWithdraw" class="modal-overlay" @click="showWithdraw = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>申请提现</h3>
          <span class="modal-close" @click="showWithdraw = false">×</span>
        </div>
        <div class="modal-body">
          <div class="withdraw-tip">
            最低提现{{ minWithdraw }}星石（{{ (minWithdraw / coinRate).toFixed(1) }}元），手续费{{ withdrawFeeRate }}%
          </div>
          
          <div class="form-group">
            <label class="form-label">提现星石</label>
            <input 
              v-model="withdrawForm.amount" 
              type="number" 
              class="form-input" 
              placeholder="请输入提现数量"
            />
            <div class="quick-amounts">
              <span @click="withdrawForm.amount = minWithdraw">{{ minWithdraw }}</span>
              <span @click="withdrawForm.amount = 500">500</span>
              <span @click="withdrawForm.amount = 1000">1000</span>
              <span @click="withdrawForm.amount = wallet?.balance || 0">全部</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">到账金额</label>
            <div class="amount-preview">
              <span class="amount-num">{{ realAmount }}</span>
              <span class="amount-unit">元</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">收款方式</label>
            <div class="pay-methods">
              <span 
                v-for="opt in payOptions" 
                :key="opt.value"
                class="pay-option"
                :class="{ active: withdrawForm.payMethod === opt.value }"
                @click="withdrawForm.payMethod = opt.value"
              >{{ opt.text }}</span>
            </div>
          </div>
          
          <div class="form-group">
            <label class="form-label">真实姓名</label>
            <input v-model="withdrawForm.payName" class="form-input" placeholder="请输入真实姓名" />
          </div>
          
          <div class="form-group">
            <label class="form-label">收款账号</label>
            <input v-model="withdrawForm.payAccount" class="form-input" placeholder="支付宝/微信/银行卡号" />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showWithdraw = false">取消</button>
          <button class="btn btn-primary" @click="submitWithdraw">提交申请</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { showToast, showSuccessToast } from 'vant'
import { getWallet, getTransactions, createWithdraw, getPublicConfig } from '@/api'
import dayjs from 'dayjs'

const wallet = ref<any>(null)
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const showWithdraw = ref(false)
const minWithdraw = ref(100)
const withdrawFeeRate = ref(5)
const coinRate = ref(10)
const totalIncome = ref(0)
const todayIncome = ref(0)
const totalWithdraw = ref(0)

const withdrawForm = reactive({ 
  amount: 100, 
  payMethod: 'alipay', 
  payName: '', 
  payAccount: '' 
})

const payOptions = [
  { text: '支付宝', value: 'alipay' }, 
  { text: '微信', value: 'wechat' }, 
  { text: '银行卡', value: 'bank' }
]

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

const loadWallet = async () => { 
  wallet.value = await getWallet() 
}

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await getTransactions({ page: page.value, pageSize: 50, type: 'INCOME,WITHDRAW' })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total
    page.value++
    
    const allTx = list.value
    totalIncome.value = allTx.filter(t => t.type === 'INCOME' && t.amount > 0).reduce((s, t) => s + t.amount, 0)
    totalWithdraw.value = allTx.filter(t => t.type === 'WITHDRAW').reduce((s, t) => s + Math.abs(t.amount), 0)
    const today = dayjs().format('YYYY-MM-DD')
    todayIncome.value = allTx.filter(t => t.type === 'INCOME' && t.amount > 0 && dayjs(t.createdAt).format('YYYY-MM-DD') === today).reduce((s, t) => s + t.amount, 0)
  } finally { 
    loading.value = false 
  }
}

const submitWithdraw = async () => {
  const amount = Number(withdrawForm.amount) || 0
  if (amount < minWithdraw.value) { 
    showToast(`最低提现${minWithdraw.value}星石`)
    return 
  }
  if (amount > (wallet.value?.balance || 0)) {
    showToast('余额不足')
    return
  }
  if (!withdrawForm.payName || !withdrawForm.payAccount) { 
    showToast('请填写收款信息')
    return 
  }
  await createWithdraw(withdrawForm)
  showSuccessToast('提现申请已提交')
  showWithdraw.value = false
  loadWallet()
}

const typeText = (t: string) => ({ 
  INCOME: '订单收入', 
  WITHDRAW: '提现', 
  WITHDRAW_REFUND: '提现退回', 
  ADJUST: '调整' 
}[t] || t)

const txIcon = (t: string) => ({ 
  INCOME: '💰', 
  WITHDRAW: '🏦', 
  WITHDRAW_REFUND: '↩️', 
  ADJUST: '⚙️' 
}[t] || '📝')

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

onMounted(() => { 
  loadConfig()
  loadWallet()
  loadData() 
})
</script>

<style scoped>
.wallet-page { padding: 0; }

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #00b894 0%, #55efc4 100%);
  border-radius: var(--radius-lg);
  padding: 32px;
  color: #fff;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.balance-label { font-size: 15px; opacity: 0.9; margin-bottom: 8px; }
.balance-num { font-size: 48px; font-weight: 700; margin-bottom: 8px; }
.balance-sub { display: flex; gap: 24px; font-size: 13px; opacity: 0.85; }

/* 统计卡片 */
.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-color);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: #f0f7ff;
}

.stat-num { font-size: 24px; font-weight: 700; color: var(--text-primary); }
.stat-label { font-size: 13px; color: var(--text-secondary); margin-top: 2px; }

/* 卡片 */
.card-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.card-title { font-size: 17px; font-weight: 600; color: var(--text-primary); }

.tx-type {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tx-icon { font-size: 18px; }

.amount { font-weight: 600; }
.amount.positive { color: var(--success); }
.amount.negative { color: var(--danger); }
.time { color: var(--text-muted); font-size: 13px; }

.loading, .empty-state {
  text-align: center;
  padding: 40px;
  color: var(--text-muted);
}

.empty-icon { font-size: 48px; margin-bottom: 12px; }
.empty-state p { font-size: 14px; color: var(--text-secondary); }

.load-more {
  text-align: center;
  padding: 20px;
  border-top: 1px solid var(--border-color);
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  width: 480px;
  max-width: 90vw;
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 { font-size: 18px; font-weight: 600; }
.modal-close { font-size: 24px; color: var(--text-muted); cursor: pointer; line-height: 1; }

.modal-body { padding: 24px; }

.withdraw-tip {
  background: #f0edff;
  color: var(--secondary);
  padding: 12px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  margin-bottom: 20px;
}

.quick-amounts {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.quick-amounts span {
  flex: 1;
  text-align: center;
  padding: 8px;
  background: #f5f7fa;
  border-radius: 6px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.quick-amounts span:hover { background: #e8ecf1; color: var(--primary); }

.amount-preview {
  display: flex;
  align-items: baseline;
  gap: 4px;
  padding: 12px 16px;
  background: #f6ffed;
  border-radius: var(--radius-sm);
}

.amount-preview .amount-num { font-size: 28px; font-weight: 700; color: var(--success); }
.amount-preview .amount-unit { font-size: 14px; color: var(--text-muted); }

.pay-methods {
  display: flex;
  gap: 10px;
}

.pay-option {
  flex: 1;
  text-align: center;
  padding: 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.pay-option.active {
  border-color: var(--primary);
  background: #e6f7f0;
  color: var(--primary);
  font-weight: 600;
}

.modal-footer {
  display: flex;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
}

.modal-footer .btn { flex: 1; }
</style>
