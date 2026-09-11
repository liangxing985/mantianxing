<template>
  <div class="wallet-page">
    <div class="page-header">
      <h1 class="page-title">我的钱包</h1>
      <p class="page-subtitle">管理你的星石余额和收支明细</p>
    </div>

    <!-- 余额卡片 -->
    <div class="balance-card">
      <div class="balance-left">
        <div class="balance-label">星石余额</div>
        <div class="balance-num">{{ wallet?.balance || 0 }}</div>
        <div class="frozen-label">冻结中: {{ wallet?.frozen || 0 }} 星石</div>
      </div>
      <div class="balance-right">
        <button class="btn-recharge" @click="showRecharge = true">充值星石</button>
        <button class="btn-withdraw" @click="$router.push('/withdraw')">申请提现</button>
      </div>
    </div>

    <!-- 快捷信息 -->
    <div class="quick-stats">
      <div class="stat-item">
        <div class="stat-icon recharge">💰</div>
        <div class="stat-info">
          <div class="stat-label">累计充值</div>
          <div class="stat-value">{{ totalRecharge }} 星石</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon consume">🎮</div>
        <div class="stat-info">
          <div class="stat-label">累计消费</div>
          <div class="stat-value">{{ totalConsume }} 星石</div>
        </div>
      </div>
      <div class="stat-item">
        <div class="stat-icon rate">💱</div>
        <div class="stat-info">
          <div class="stat-label">兑换比例</div>
          <div class="stat-value">1元 = {{ coinRate }}星石</div>
        </div>
      </div>
    </div>

    <!-- 收支明细 -->
    <div class="section-card">
      <h2 class="section-title">收支明细</h2>
      <div class="tx-list">
        <div v-for="tx in list" :key="tx.id" class="tx-item">
          <div class="tx-icon" :class="txClass(tx.type)">{{ txIcon(tx.type) }}</div>
          <div class="tx-info">
            <div class="tx-type">{{ typeText(tx.type) }}</div>
            <div class="tx-time">{{ formatTime(tx.createdAt) }}</div>
          </div>
          <div class="tx-amount" :class="{ positive: tx.amount > 0, negative: tx.amount < 0 }">
            {{ tx.amount > 0 ? '+' : '' }}{{ tx.amount }}
          </div>
        </div>
      </div>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="finished && list.length > 0" class="finished">没有更多了</div>
      <div v-else-if="list.length === 0" class="empty">暂无收支记录</div>
      
      <div v-if="!finished && list.length > 0" class="load-more">
        <button class="load-more-btn" @click="loadData" :disabled="loading">
          {{ loading ? '加载中...' : '加载更多' }}
        </button>
      </div>
    </div>

    <!-- 充值弹窗 -->
    <div v-if="showRecharge" class="modal-overlay" @click="showRecharge = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>充值星石</h3>
          <span class="modal-close" @click="showRecharge = false">×</span>
        </div>
        <div class="modal-body">
          <div class="recharge-tip">
            <div class="tip-icon">💡</div>
            <p>一期采用手动充值模式</p>
            <p>请联系客服微信转账后，由后台加星石</p>
          </div>
          <div class="wechat-box" @click="copyWechat">
            <span class="wechat-label">客服微信</span>
            <span class="wechat-id">mantianxing_kefu</span>
            <span class="copy-btn">点击复制</span>
          </div>
          <p class="rate-tip">1元 = {{ coinRate }}星石，转账请备注用户名</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { showToast } from 'vant'
import { getWallet, getTransactions, getPublicConfig } from '@/api'
import dayjs from 'dayjs'

const wallet = ref<any>(null)
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const showRecharge = ref(false)
const coinRate = ref(10)

const totalRecharge = computed(() => {
  return list.value.filter(t => t.type === 'RECHARGE' || t.type === 'ADJUST').reduce((sum, t) => sum + Math.max(0, t.amount), 0)
})

const totalConsume = computed(() => {
  return list.value.filter(t => t.type === 'CONSUME').reduce((sum, t) => sum + Math.abs(t.amount), 0)
})

const loadConfig = async () => {
  try {
    const res: any = await getPublicConfig()
    if (res.coinExchangeRate) coinRate.value = res.coinExchangeRate
  } catch (e) {}
}

const loadWallet = async () => { wallet.value = await getWallet() }

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await getTransactions({ page: page.value, pageSize: 20 })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total
    page.value++
  } finally {
    loading.value = false
  }
}

const copyWechat = () => {
  navigator.clipboard?.writeText('mantianxing_kefu')
  showToast('已复制客服微信号')
}

const typeText = (t: string) => ({
  RECHARGE: '充值', CONSUME: '消费', REFUND: '退款',
  INCOME: '收入', WITHDRAW: '提现', WITHDRAW_REFUND: '提现退回',
  ADJUST: '调整', FROZEN: '冻结',
}[t] || t)

const txIcon = (t: string) => ({
  RECHARGE: '💰', CONSUME: '🎮', REFUND: '↩️',
  INCOME: '💵', WITHDRAW: '🏦', WITHDRAW_REFUND: '↩️',
  ADJUST: '⚙️', FROZEN: '🔒',
}[t] || '📝')

const txClass = (t: string) => ({
  RECHARGE: 'icon-recharge', CONSUME: 'icon-consume', REFUND: 'icon-refund',
  INCOME: 'icon-income', WITHDRAW: 'icon-withdraw',
}[t] || 'icon-default')

const formatTime = (t: string) => dayjs(t).format('YYYY-MM-DD HH:mm')

onMounted(() => { loadConfig(); loadWallet(); loadData() })
</script>

<style scoped>
.wallet-page {
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 15px;
  color: #999;
}

/* 余额卡片 */
.balance-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  box-shadow: 0 8px 24px rgba(102,126,234,0.3);
}

.balance-left {
  color: #fff;
}

.balance-label {
  font-size: 15px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.balance-num {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 8px;
}

.frozen-label {
  font-size: 13px;
  opacity: 0.8;
}

.balance-right {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn-recharge {
  background: #fff;
  color: #6c5ce7;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-recharge:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

.btn-withdraw {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.4);
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-withdraw:hover {
  background: rgba(255,255,255,0.3);
}

/* 快捷统计 */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-item {
  background: #fff;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon.recharge { background: #f6ffed; }
.stat-icon.consume { background: #fff7e6; }
.stat-icon.rate { background: #f0f5ff; }

.stat-label {
  font-size: 13px;
  color: #999;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

/* 收支明细 */
.section-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.tx-list {
  display: flex;
  flex-direction: column;
}

.tx-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid #f5f5f5;
}

.tx-item:last-child {
  border-bottom: none;
}

.tx-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.icon-recharge { background: #f6ffed; }
.icon-consume { background: #fff1f0; }
.icon-refund { background: #e6f7ff; }
.icon-income { background: #f6ffed; }
.icon-withdraw { background: #fff7e6; }
.icon-default { background: #f5f5f5; }

.tx-info {
  flex: 1;
}

.tx-type {
  font-size: 15px;
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.tx-time {
  font-size: 13px;
  color: #999;
}

.tx-amount {
  font-size: 20px;
  font-weight: 600;
}

.tx-amount.positive { color: #52c41a; }
.tx-amount.negative { color: #f5222d; }

/* 加载状态 */
.loading, .finished, .empty {
  text-align: center;
  padding: 32px;
  color: #999;
  font-size: 14px;
}

.load-more {
  text-align: center;
  margin-top: 16px;
}

.load-more-btn {
  background: #f5f5f5;
  color: #666;
  border: none;
  padding: 10px 32px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #e8e8e8;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  width: 420px;
  max-width: 90%;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
}

.modal-close {
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
}

.modal-body {
  padding: 24px;
}

.recharge-tip {
  text-align: center;
  margin-bottom: 24px;
}

.tip-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.recharge-tip p {
  font-size: 14px;
  color: #666;
  margin: 4px 0;
}

.wechat-box {
  background: #f5f3ff;
  border: 1px solid #d9d2ff;
  border-radius: 10px;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  margin-bottom: 16px;
  transition: all 0.2s;
}

.wechat-box:hover {
  background: #ede9fe;
}

.wechat-label {
  font-size: 14px;
  color: #666;
}

.wechat-id {
  font-size: 16px;
  font-weight: 600;
  color: #6c5ce7;
}

.copy-btn {
  font-size: 13px;
  color: #6c5ce7;
  background: #fff;
  padding: 4px 12px;
  border-radius: 6px;
}

.rate-tip {
  text-align: center;
  font-size: 13px;
  color: #999;
}
</style>
