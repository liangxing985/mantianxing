<template>
  <div v-if="order" class="order-detail">
    <van-nav-bar title="订单详情" left-arrow @click-left="$router.back()" />

    <!-- 状态卡片 -->
    <div class="status-card" :class="order.status">
      <div class="status-text">{{ statusText(order.status) }}</div>
      <div class="status-desc">{{ statusDesc(order.status) }}</div>
    </div>

    <!-- 陪玩信息 -->
    <div class="card" v-if="order.provider">
      <div class="card-title">陪玩信息</div>
      <div class="provider-row" @click="$router.push(`/provider/${order.provider.id}`)">
        <van-image round width="48" height="48" :src="order.provider.avatar || defaultAvatar" />
        <div class="info">
          <div class="name">{{ order.provider.nickname }}</div>
          <div class="sub">Lv.{{ order.provider.providerProfile?.level }} · ⭐{{ order.provider.providerProfile?.rating?.toFixed(1) }}</div>
        </div>
        <van-icon name="arrow" />
      </div>
    </div>

    <!-- 订单信息 -->
    <div class="card">
      <div class="card-title">订单信息</div>
      <van-cell title="订单号" :value="order.orderNo" />
      <van-cell title="游戏服务" :value="`${order.serviceItem?.game?.name} / ${order.serviceItem?.name}`" />
      <van-cell title="数量" :value="`${order.duration} ${unitText(order.unit)}`" />
      <van-cell title="单价" :value="`${order.unitPrice} 星石`" />
      <van-cell title="总金额">
        <template #value>
          <span style="color: #f5576c; font-weight: 600;">{{ order.totalAmount }} 星石</span>
        </template>
      </van-cell>
      <van-cell title="平台抽成" :value="`${order.platformFee || 0} 星石`" />
      <van-cell title="联系方式" :value="`${order.contactType}: ${order.contactValue}`" />
      <van-cell title="订单要求" :value="order.requirement || '无'" />
    </div>

    <!-- 时间线 -->
    <div class="card">
      <div class="card-title">订单进度</div>
      <van-steps :active="currentStep" active-color="#6c5ce7">
        <van-step>创建订单</van-step>
        <van-step>陪玩接单</van-step>
        <van-step>开始服务</van-step>
        <van-step>提交报单</van-step>
        <van-step>审核完成</van-step>
      </van-steps>
    </div>

    <!-- 评价区 -->
    <div class="card" v-if="order.status === 'COMPLETED' && !order.review">
      <div class="card-title">评价订单</div>
      <van-rate v-model="reviewForm.rating" />
      <van-field v-model="reviewForm.comment" type="textarea" placeholder="说说这次服务体验吧" rows="2" />
      <van-button type="primary" block round style="margin-top: 12px;" @click="submitReview">提交评价</van-button>
    </div>

    <div class="card" v-if="order.review">
      <div class="card-title">我的评价</div>
      <div class="review">
        <div>{{ '⭐'.repeat(order.review.rating) }}</div>
        <p>{{ order.review.comment || '无评价内容' }}</p>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-bar" v-if="order.status === 'PAID'">
      <van-button block type="danger" plain @click="handleCancel">取消订单</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showConfirmDialog, showToast } from 'vant'
import { getOrderDetail, cancelOrder, reviewOrder } from '@/api'

const route = useRoute()
const order = ref<any>(null)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const reviewForm = reactive({ rating: 5, comment: '' })

const currentStep = computed(() => {
  const map: any = { CREATED: 0, PAID: 1, ASSIGNED: 2, SERVING: 3, REVIEWING: 4, COMPLETED: 5 }
  return map[order.value?.status] ?? 0
})

const loadData = async () => {
  order.value = await getOrderDetail(Number(route.params.id))
}

const handleCancel = async () => {
  await showConfirmDialog({ title: '取消订单', message: '确定取消吗？星石将原路退回' })
  await cancelOrder(order.value.id)
  showToast('已取消')
  loadData()
}

const submitReview = async () => {
  await reviewOrder(order.value.id, reviewForm)
  showToast('评价成功')
  loadData()
}

const statusText = (s: string) => ({
  CREATED: '待支付', PAID: '等待陪玩接单', ASSIGNED: '陪玩已接单', SERVING: '服务进行中',
  REVIEWING: '等待运营审核', COMPLETED: '订单已完成', CANCELLED: '订单已取消', EXPIRED: '订单已过期',
}[s] || s)
const statusDesc = (s: string) => ({
  PAID: '陪玩正在赶来，请稍候...',
  ASSIGNED: '陪玩已接单，请尽快联系',
  SERVING: '陪玩正在为您服务',
  REVIEWING: '报单已提交，运营审核中',
  COMPLETED: '感谢您的使用，欢迎下次光临',
  CANCELLED: '订单已取消，星石已退回',
}[s] || '')
const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')

onMounted(loadData)
</script>

<style scoped>
.order-detail { padding-bottom: 70px; }
.status-card {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  padding: 24px 16px;
  text-align: center;
}
.status-card.CANCELLED, .status-card.EXPIRED { background: linear-gradient(135deg, #999, #bbb); }
.status-card.COMPLETED { background: linear-gradient(135deg, #52c41a, #95de64); }
.status-text { font-size: 20px; font-weight: 600; }
.status-desc { font-size: 13px; opacity: 0.9; margin-top: 4px; }
.card { background: #fff; margin: 12px; border-radius: 12px; overflow: hidden; }
.card-title { padding: 14px 16px 0; font-size: 15px; font-weight: 600; }
.provider-row { display: flex; align-items: center; padding: 14px 16px; }
.info { flex: 1; margin-left: 12px; }
.name { font-size: 15px; font-weight: 600; }
.sub { font-size: 12px; color: #999; margin-top: 2px; }
.review { padding: 14px 16px; }
.review p { font-size: 13px; color: #666; margin-top: 6px; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 16px; background: #fff; }
</style>
