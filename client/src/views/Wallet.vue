<template>
  <div class="wallet-page">
    <div class="wallet-header">
      <div class="balance-label">星石余额</div>
      <div class="balance">{{ wallet?.balance || 0 }}</div>
      <div class="frozen">冻结中: {{ wallet?.frozen || 0 }} 星石</div>
      <div class="actions">
        <van-button round size="small" type="primary" @click="showRecharge = true">充值</van-button>
        <van-button round size="small" plain @click="$router.push('/withdraw')">提现</van-button>
      </div>
    </div>

    <div class="section">
      <div class="section-title">收支明细</div>
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

    <!-- 充值弹窗 -->
    <van-dialog v-model:show="showRecharge" title="充值星石" show-cancel-button>
      <div style="padding: 20px;">
        <p style="text-align: center; color: #666; margin-bottom: 16px;">
          一期采用手动充值模式<br/>请联系客服微信转账后，由后台加星石
        </p>
        <van-cell title="客服微信" value="mantianxing_kefu" is-link @click="copyWechat" />
        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 12px;">
          1元 = 10星石，转账请备注用户名
        </p>
      </div>
    </van-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { getWallet, getTransactions } from '@/api'
import dayjs from 'dayjs'

const wallet = ref<any>(null)
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const showRecharge = ref(false)

const loadWallet = async () => { wallet.value = await getWallet() }

const loadData = async () => {
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
  ADJUST: '调整',
}[t] || t)
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')

onMounted(() => { loadWallet(); loadData() })
</script>

<style scoped>
.wallet-header {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  padding: 30px 20px;
  text-align: center;
}
.balance-label { font-size: 14px; opacity: 0.9; }
.balance { font-size: 40px; font-weight: 700; margin: 8px 0; }
.frozen { font-size: 12px; opacity: 0.8; margin-bottom: 16px; }
.actions { display: flex; gap: 12px; justify-content: center; }
.section { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.tx-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.tx-type { font-size: 14px; }
.tx-time { font-size: 12px; color: #999; margin-top: 2px; }
.tx-amount { font-size: 16px; font-weight: 600; }
.tx-amount.positive { color: #52c41a; }
.tx-amount.negative { color: #f5576c; }
</style>
