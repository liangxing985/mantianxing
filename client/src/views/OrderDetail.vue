<template>
  <div v-if="order" class="order-detail-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">订单详情</h1>
    </div>

    <div class="detail-content">
      <!-- 状态卡片 -->
      <div class="status-card" :class="order.status">
        <div class="status-text">{{ statusText(order.status) }}</div>
        <div class="status-desc">{{ statusDesc(order.status) }}</div>
      </div>

      <div class="detail-grid">
        <!-- 左侧 -->
        <div class="left-section">
          <!-- 陪玩信息 -->
          <div class="card" v-if="order.provider">
            <h3 class="card-title">陪玩信息</h3>
            <div class="provider-row" @click="$router.push(`/provider/${order.provider.id}`)">
              <img :src="order.provider.avatar || defaultAvatar" class="provider-avatar" />
              <div class="provider-info">
                <div class="provider-name">{{ order.provider.nickname }}</div>
                <div class="provider-sub">Lv.{{ order.provider.providerProfile?.level }} · ⭐{{ order.provider.providerProfile?.rating?.toFixed(1) }}</div>
              </div>
              <span class="arrow">→</span>
            </div>
          </div>

          <!-- 订单信息 -->
          <div class="card">
            <h3 class="card-title">订单信息</h3>
            <div class="info-row">
              <span class="info-label">订单号</span>
              <span class="info-value">{{ order.orderNo }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">游戏服务</span>
              <span class="info-value">{{ order.serviceItem?.game?.name }} / {{ order.serviceItem?.name }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">数量</span>
              <span class="info-value">{{ order.duration }} {{ unitText(order.serviceItem?.unit) }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">单价</span>
              <span class="info-value">{{ order.unitPrice }} 星石</span>
            </div>
            <div class="info-row">
              <span class="info-label">总金额</span>
              <span class="info-value price">{{ order.totalAmount }} 星石</span>
            </div>
            <div class="info-row">
              <span class="info-label">平台抽成</span>
              <span class="info-value">{{ order.platformFee || 0 }} 星石</span>
            </div>
            <div class="info-row">
              <span class="info-label">联系方式</span>
              <span class="info-value">{{ order.contactType }}: {{ order.contactValue }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">订单要求</span>
              <span class="info-value">{{ order.requirement || '无' }}</span>
            </div>
          </div>

          <!-- 评价区 -->
          <div class="card" v-if="order.status === 'COMPLETED' && !order.customerRating">
            <h3 class="card-title">评价订单</h3>
            <div class="rating-row">
              <span class="rating-label">评分：</span>
              <div class="stars">
                <span
                  v-for="i in 5"
                  :key="i"
                  class="star"
                  :class="{ active: i <= reviewForm.rating }"
                  @click="reviewForm.rating = i"
                >★</span>
              </div>
            </div>
            <textarea
              class="review-textarea"
              v-model="reviewForm.comment"
              placeholder="说说这次服务体验吧"
              rows="3"
            ></textarea>
            <button class="submit-btn" @click="submitReview">提交评价</button>
          </div>

          <div class="card" v-if="order.customerRating">
            <h3 class="card-title">我的评价</h3>
            <div class="review">
              <div class="review-stars">{{ '⭐'.repeat(order.customerRating) }}</div>
              <p>{{ order.customerComment || '无评价内容' }}</p>
            </div>
          </div>
        </div>

        <!-- 右侧：订单进度 -->
        <div class="right-section">
          <div class="card">
            <h3 class="card-title">订单进度</h3>
            <div class="timeline">
              <div
                v-for="(step, idx) in steps"
                :key="idx"
                class="timeline-item"
                :class="{ active: idx <= currentStep, done: idx < currentStep }"
              >
                <div class="timeline-dot"></div>
                <div class="timeline-content">
                  <div class="timeline-title">{{ step }}</div>
                </div>
                <div v-if="idx < steps.length - 1" class="timeline-line"></div>
              </div>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="card" v-if="order.status === 'PAID'">
            <button class="cancel-btn" @click="handleCancel">取消订单</button>
            <p class="cancel-tip">取消后星石将原路退回</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getOrderDetail, cancelOrder, reviewOrder } from '@/api'

const route = useRoute()
const order = ref<any>(null)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'
const reviewForm = reactive({ rating: 5, comment: '' })

const steps = ['创建订单', '陪玩接单', '开始服务', '提交报单', '审核完成']

const currentStep = computed(() => {
  const map: any = { CREATED: 0, PAID: 1, ASSIGNED: 2, SERVING: 3, REVIEWING: 4, COMPLETED: 5 }
  return map[order.value?.status] ?? 0
})

const loadData = async () => {
  order.value = await getOrderDetail(Number(route.params.id))
}

const handleCancel = async () => {
  if (!confirm('确定取消吗？星石将原路退回')) return
  await cancelOrder(order.value.id)
  alert('已取消')
  loadData()
}

const submitReview = async () => {
  await reviewOrder(order.value.id, reviewForm)
  alert('评价成功')
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
.order-detail-page {
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

.status-card {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  padding: 32px;
  border-radius: 16px;
  text-align: center;
  margin-bottom: 24px;
}

.status-card.CANCELLED, .status-card.EXPIRED {
  background: linear-gradient(135deg, #999, #bbb);
}

.status-card.COMPLETED {
  background: linear-gradient(135deg, #52c41a, #95de64);
}

.status-text {
  font-size: 28px;
  font-weight: 700;
}

.status-desc {
  font-size: 15px;
  opacity: 0.9;
  margin-top: 8px;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
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

.provider-row {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px 0;
}

.provider-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
}

.provider-info {
  flex: 1;
}

.provider-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.provider-sub {
  font-size: 13px;
  color: #999;
  margin-top: 4px;
}

.arrow {
  color: #ccc;
  font-size: 18px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 10px 0;
  border-bottom: 1px solid #f8f8f8;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  color: #999;
  font-size: 14px;
  flex-shrink: 0;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
  text-align: right;
  max-width: 60%;
  word-break: break-all;
}

.info-value.price {
  color: #f5222d;
  font-weight: 600;
  font-size: 16px;
}

/* 时间线 */
.timeline {
  padding: 8px 0;
}

.timeline-item {
  position: relative;
  padding-left: 32px;
  padding-bottom: 24px;
}

.timeline-item:last-child {
  padding-bottom: 0;
}

.timeline-dot {
  position: absolute;
  left: 0;
  top: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e8e8e8;
  border: 3px solid #fff;
  box-shadow: 0 0 0 2px #e8e8e8;
}

.timeline-item.active .timeline-dot {
  background: #6c5ce7;
  box-shadow: 0 0 0 2px #6c5ce7;
}

.timeline-item.done .timeline-dot {
  background: #52c41a;
  box-shadow: 0 0 0 2px #52c41a;
}

.timeline-line {
  position: absolute;
  left: 7px;
  top: 20px;
  width: 2px;
  height: calc(100% - 12px);
  background: #e8e8e8;
}

.timeline-item.done .timeline-line {
  background: #52c41a;
}

.timeline-title {
  font-size: 14px;
  color: #999;
  font-weight: 500;
}

.timeline-item.active .timeline-title {
  color: #6c5ce7;
  font-weight: 600;
}

.timeline-item.done .timeline-title {
  color: #52c41a;
}

/* 评价 */
.rating-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.rating-label {
  font-size: 14px;
  color: #666;
}

.stars {
  display: flex;
  gap: 4px;
}

.star {
  font-size: 24px;
  color: #e8e8e8;
  cursor: pointer;
  transition: color 0.2s;
}

.star.active {
  color: #faad14;
}

.review-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  font-family: inherit;
  margin-bottom: 16px;
}

.review-textarea:focus {
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108,92,231,0.1);
}

.submit-btn {
  width: 100%;
  padding: 12px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108,92,231,0.4);
}

.review {
  padding: 8px 0;
}

.review-stars {
  font-size: 18px;
  margin-bottom: 8px;
}

.review p {
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.6;
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: #fff;
  color: #f5222d;
  border: 1px solid #f5222d;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn:hover {
  background: #fff1f0;
}

.cancel-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 12px 0 0;
}

@media (max-width: 900px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
