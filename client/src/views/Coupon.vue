<template>
  <div class="coupon-page">
    <div class="tabs">
      <div class="tab" :class="{ active: activeTab === 'available' }" @click="activeTab = 'available'">可领取</div>
      <div class="tab" :class="{ active: activeTab === 'my' }" @click="activeTab = 'my'; loadMyCoupons()">我的优惠券</div>
    </div>

    <!-- 可领取的优惠券 -->
    <div v-if="activeTab === 'available'" class="coupon-list">
      <div v-if="availableCoupons.length === 0" class="empty">暂无可领取的优惠券</div>
      <div v-for="c in availableCoupons" :key="c.id" class="coupon-card">
        <div class="coupon-left" :class="c.type">
          <div class="coupon-value">
            <span v-if="c.type === 'FIXED'">{{ c.discountValue }}</span>
            <span v-else-if="c.type === 'DISCOUNT'">{{ (c.discountValue / 10).toFixed(1) }}</span>
            <span v-else>新人</span>
          </div>
          <div class="coupon-unit">
            <span v-if="c.type === 'FIXED'">星石</span>
            <span v-else-if="c.type === 'DISCOUNT'">折</span>
            <span v-else>专享</span>
          </div>
        </div>
        <div class="coupon-right">
          <div class="coupon-name">{{ c.name }}</div>
          <div class="coupon-condition">
            满{{ c.minAmount }}星石可用
            <span v-if="c.totalCount > 0"> · 剩余{{ c.totalCount - c.usedCount }}张</span>
          </div>
          <div class="coupon-time" v-if="c.endTime">有效期至 {{ fmtDate(c.endTime) }}</div>
          <button class="claim-btn" :disabled="!c.canClaim" @click="claimCoupon(c)">
            {{ c.canClaim ? '立即领取' : '已领完' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 我的优惠券 -->
    <div v-if="activeTab === 'my'" class="coupon-list">
      <div class="sub-tabs">
        <div class="sub-tab" :class="{ active: myStatus === '' }" @click="myStatus = ''; loadMyCoupons()">全部</div>
        <div class="sub-tab" :class="{ active: myStatus === 'UNUSED' }" @click="myStatus = 'UNUSED'; loadMyCoupons()">未使用</div>
        <div class="sub-tab" :class="{ active: myStatus === 'USED' }" @click="myStatus = 'USED'; loadMyCoupons()">已使用</div>
        <div class="sub-tab" :class="{ active: myStatus === 'EXPIRED' }" @click="myStatus = 'EXPIRED'; loadMyCoupons()">已过期</div>
      </div>
      <div v-if="myCoupons.length === 0" class="empty">暂无优惠券</div>
      <div v-for="uc in myCoupons" :key="uc.id" class="coupon-card" :class="{ disabled: uc.status !== 'UNUSED' }">
        <div class="coupon-left" :class="uc.coupon.type">
          <div class="coupon-value">
            <span v-if="uc.coupon.type === 'FIXED'">{{ uc.coupon.discountValue }}</span>
            <span v-else-if="uc.coupon.type === 'DISCOUNT'">{{ (uc.coupon.discountValue / 10).toFixed(1) }}</span>
            <span v-else>新人</span>
          </div>
          <div class="coupon-unit">
            <span v-if="uc.coupon.type === 'FIXED'">星石</span>
            <span v-else-if="uc.coupon.type === 'DISCOUNT'">折</span>
            <span v-else>专享</span>
          </div>
        </div>
        <div class="coupon-right">
          <div class="coupon-name">{{ uc.coupon.name }}</div>
          <div class="coupon-condition">满{{ uc.coupon.minAmount }}星石可用</div>
          <div class="coupon-time" v-if="uc.expireAt">有效期至 {{ fmtDate(uc.expireAt) }}</div>
          <div class="status-tag" :class="uc.status">
            {{ statusText(uc.status) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { showToast } from 'vant'
import dayjs from 'dayjs'

const activeTab = ref('available')
const myStatus = ref('')
const availableCoupons = ref<any[]>([])
const myCoupons = ref<any[]>([])

onMounted(() => {
  loadAvailableCoupons()
})

async function loadAvailableCoupons() {
  try {
    const res: any = await request.get('/coupons/available')
    availableCoupons.value = res || []
  } catch (e) {}
}

async function loadMyCoupons() {
  try {
    const params = myStatus.value ? { status: myStatus.value } : {}
    const res: any = await request.get('/coupons/my', { params })
    myCoupons.value = res || []
  } catch (e) {}
}

async function claimCoupon(c: any) {
  try {
    await request.post(`/coupons/${c.id}/claim`)
    showToast('领取成功')
    loadAvailableCoupons()
  } catch (e: any) {
    showToast(e.response?.data?.message || '领取失败')
  }
}

function fmtDate(t: string) {
  return dayjs(t).format('YYYY-MM-DD')
}

function statusText(s: string) {
  return { UNUSED: '未使用', USED: '已使用', EXPIRED: '已过期' }[s] || s
}
</script>

<style scoped>
.coupon-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 20px; }
.tabs { display: flex; background: #fff; position: sticky; top: 0; z-index: 10; }
.tab { flex: 1; text-align: center; padding: 14px 0; font-size: 15px; color: #666; cursor: pointer; }
.tab.active { color: #1677ff; font-weight: 600; border-bottom: 2px solid #1677ff; }
.sub-tabs { display: flex; background: #fff; padding: 10px 16px; gap: 16px; }
.sub-tab { font-size: 13px; color: #999; cursor: pointer; padding: 4px 0; }
.sub-tab.active { color: #1677ff; font-weight: 600; }
.coupon-list { padding: 12px; }
.empty { text-align: center; color: #999; padding: 60px 0; }
.coupon-card { display: flex; background: #fff; border-radius: 10px; margin-bottom: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.coupon-card.disabled { opacity: 0.6; }
.coupon-left { width: 100px; background: linear-gradient(135deg, #ff6b6b, #ee5a5a); color: #fff; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px 0; position: relative; }
.coupon-left.DISCOUNT { background: linear-gradient(135deg, #52c41a, #389e0d); }
.coupon-left.NEWBIE { background: linear-gradient(135deg, #faad14, #d48806); }
.coupon-left::after { content: ''; position: absolute; right: -6px; top: 50%; transform: translateY(-50%); width: 12px; height: 12px; background: #f5f5f5; border-radius: 50%; }
.coupon-value { font-size: 28px; font-weight: 700; line-height: 1; }
.coupon-unit { font-size: 12px; margin-top: 4px; }
.coupon-right { flex: 1; padding: 12px 16px; display: flex; flex-direction: column; justify-content: center; }
.coupon-name { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 4px; }
.coupon-condition { font-size: 12px; color: #999; margin-bottom: 4px; }
.coupon-time { font-size: 11px; color: #bbb; margin-bottom: 8px; }
.claim-btn { align-self: flex-start; background: #ff6b6b; color: #fff; border: none; padding: 5px 16px; border-radius: 14px; font-size: 12px; cursor: pointer; }
.claim-btn:disabled { background: #ccc; cursor: not-allowed; }
.status-tag { align-self: flex-start; font-size: 12px; padding: 2px 10px; border-radius: 10px; }
.status-tag.UNUSED { background: #e6f4ff; color: #1677ff; }
.status-tag.USED { background: #f0f0f0; color: #999; }
.status-tag.EXPIRED { background: #fff0f0; color: #ff4d4f; }
</style>
