<template>
  <div v-if="provider" class="detail-page">
    <!-- 顶部个人信息 -->
    <div class="profile-header">
      <div class="profile-bg"></div>
      <div class="profile-content">
        <img :src="provider.avatar || defaultAvatar" class="profile-avatar" />
        <div class="profile-info">
          <div class="name-row">
            <h1 class="name">{{ provider.nickname }}</h1>
            <span class="level-tag">Lv.{{ profile.level }}</span>
            <span v-if="profile.rank" class="rank-tag">{{ profile.rank }}</span>
            <span class="online-tag" :class="{ online: profile.isOnline }">
              {{ profile.isOnline ? '在线接单' : '离线' }}
            </span>
          </div>
          <p class="bio">{{ provider.bio || '这个人很懒，什么都没写' }}</p>
          <div v-if="profile.games?.length" class="game-tags">
            <span v-for="g in profile.games" :key="g.id" class="game-tag">{{ g.game?.name }}</span>
          </div>
        </div>
        <div class="profile-actions">
          <div class="balance-info">余额: {{ wallet?.balance || 0 }} 星石</div>
          <button class="order-btn" @click="goOrder">立即下单</button>
        </div>
      </div>
    </div>

    <div class="detail-container">
      <!-- 数据统计 -->
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-num">{{ profile.rating?.toFixed(1) || '5.0' }}</div>
          <div class="stat-label">综合评分</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-num">{{ profile.orderCount || 0 }}</div>
          <div class="stat-label">完成订单</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-num">{{ profile.ratingCount || 0 }}</div>
          <div class="stat-label">评价数量</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-num">{{ getMinPrice() }}</div>
          <div class="stat-label">起步价(星石/时)</div>
        </div>
      </div>

      <div class="content-grid">
        <!-- 左侧：服务项目 -->
        <div class="main-content">
          <div class="section-card">
            <h2 class="section-title">服务项目</h2>
            <div v-if="profile.pricedServices && profile.pricedServices.length > 0" class="service-list">
              <div v-for="svc in profile.pricedServices" :key="svc.id" class="service-item">
                <div class="svc-info">
                  <span class="svc-name">{{ svc.name }}</span>
                  <span class="svc-game">{{ svc.gameName }}</span>
                </div>
                <div class="svc-right">
                  <div class="svc-price">
                    <span v-if="svc.price > 0" class="price-num">{{ svc.price }}</span>
                    <span v-if="svc.price > 0" class="price-unit">星石/{{ unitText(svc.unit) }}</span>
                    <span v-else class="no-price">待定价</span>
                  </div>
                  <button v-if="svc.price > 0" class="svc-order-btn" @click="goOrderWithService(svc)">下单</button>
                </div>
              </div>
            </div>
            <div v-else class="empty">暂无服务项目</div>
          </div>

          <!-- 最近评价 -->
          <div class="section-card">
            <h2 class="section-title">最近评价</h2>
            <div v-if="reviews.length === 0" class="empty">暂无评价</div>
            <div v-for="r in reviews" :key="r.id" class="review-item">
              <div class="review-header">
                <div class="review-user">
                  <div class="review-avatar">{{ (r.customer?.nickname || '匿').charAt(0) }}</div>
                  <span class="review-name">{{ r.customer?.nickname || '匿名用户' }}</span>
                </div>
                <span class="review-stars">{{ '⭐'.repeat(r.rating) }}</span>
              </div>
              <p class="review-content">{{ r.comment }}</p>
              <div class="review-time">{{ formatTime(r.createdAt) }}</div>
            </div>
          </div>
        </div>

        <!-- 右侧：下单卡片 -->
        <div class="sidebar">
          <div class="order-card">
            <h3 class="order-title">快速下单</h3>
            <div class="order-provider">
              <img :src="provider.avatar || defaultAvatar" class="order-avatar" />
              <div>
                <div class="order-name">{{ provider.nickname }}</div>
                <div class="order-rank">{{ profile.rank || '未设置段位' }}</div>
              </div>
            </div>
            <div class="order-price-info">
              <span class="order-price-label">起步价</span>
              <span class="order-price-value">{{ getMinPrice() }} 星石/时</span>
            </div>
            <button class="order-btn-large" @click="goOrder">立即下单</button>
            <p class="order-tip">下单后陪玩确认接单即可开始服务</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getProviderDetail, getWallet } from '@/api'

const route = useRoute()
const router = useRouter()
const provider = ref<any>(null)
const profile = ref<any>({})
const reviews = ref<any[]>([])
const wallet = ref<any>(null)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadData = async () => {
  const id = Number(route.params.id)
  const [detail, w]: any = await Promise.all([getProviderDetail(id), getWallet().catch(() => null)])
  provider.value = detail
  profile.value = detail.providerProfile || {}
  reviews.value = detail.reviews || []
  wallet.value = w
}

const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || u)

const getMinPrice = () => {
  if (profile.value?.minPrice && profile.value.minPrice > 0) {
    return profile.value.minPrice
  }
  const services = profile.value?.pricedServices || []
  if (services.length === 0) return 0
  const prices = services.filter((s: any) => s.price > 0).map((s: any) => s.price)
  return prices.length ? Math.min(...prices) : 0
}

const goOrder = () => {
  const token = localStorage.getItem('client_token')
  if (!token) {
    router.push('/login')
    return
  }
  const firstService = profile.value.pricedServices?.find((s: any) => s.price > 0)
  if (!firstService) {
    showToast('该陪玩尚未设置服务价格，请联系客服')
    return
  }
  router.push({
    path: '/order/create',
    query: {
      fromProvider: '1',
      providerId: route.params.id,
      providerName: provider.value?.nickname || '',
      price: firstService.price,
      gameId: firstService.gameId,
      gameName: firstService.gameName,
    },
  })
}

const goOrderWithService = (svc: any) => {
  const token = localStorage.getItem('client_token')
  if (!token) {
    router.push('/login')
    return
  }
  router.push({
    path: '/order/create',
    query: {
      fromProvider: '1',
      providerId: route.params.id,
      providerName: provider.value?.nickname || '',
      price: svc.price,
      gameId: svc.gameId,
      gameName: svc.gameName,
      serviceItemId: svc.serviceItemId,
    },
  })
}

const formatTime = (time: string) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

onMounted(loadData)
</script>

<style scoped>
.detail-page {
  min-height: 100vh;
  background: #f0f2f5;
}

/* 顶部个人信息 */
.profile-header {
  position: relative;
  margin-bottom: 24px;
}

.profile-bg {
  height: 200px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.profile-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: flex-end;
  gap: 24px;
  margin-top: -80px;
  position: relative;
  z-index: 1;
}

.profile-avatar {
  width: 120px;
  height: 120px;
  border-radius: 16px;
  border: 4px solid #fff;
  object-fit: cover;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.profile-info {
  flex: 1;
  padding-bottom: 16px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.name {
  font-size: 28px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.2);
}

.level-tag {
  background: #fff7e6;
  color: #fa8c16;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

.rank-tag {
  background: #f5f3ff;
  color: #6c5ce7;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
}

.online-tag {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  background: rgba(0,0,0,0.3);
  color: #fff;
}

.online-tag.online {
  background: rgba(82,196,26,0.9);
}

.bio {
  font-size: 15px;
  color: rgba(255,255,255,0.9);
  margin-bottom: 12px;
}

.game-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.game-tag {
  background: rgba(255,255,255,0.2);
  color: #fff;
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 13px;
}

.profile-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  padding-bottom: 16px;
}

.balance-info {
  color: #fff;
  font-size: 14px;
  background: rgba(0,0,0,0.2);
  padding: 6px 16px;
  border-radius: 20px;
}

.order-btn {
  background: #fff;
  color: #6c5ce7;
  border: none;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.order-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0,0,0,0.2);
}

/* 内容容器 */
.detail-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 数据统计 */
.stats-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-around;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.stat-item {
  text-align: center;
}

.stat-num {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
}

.stat-label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #eee;
}

/* 内容网格 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 24px;
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

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

/* 服务项目 */
.service-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.service-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #fafafa;
  border-radius: 8px;
  transition: background 0.2s;
}

.service-item:hover {
  background: #f5f3ff;
}

.svc-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.svc-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.svc-game {
  font-size: 13px;
  color: #999;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}

.svc-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.svc-price {
  text-align: right;
}

.price-num {
  font-size: 24px;
  font-weight: 700;
  color: #f5222d;
}

.price-unit {
  font-size: 13px;
  color: #999;
  margin-left: 4px;
}

.no-price {
  font-size: 14px;
  color: #999;
}

.svc-order-btn {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.svc-order-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108,92,231,0.4);
}

/* 评价 */
.review-item {
  padding: 16px 0;
  border-bottom: 1px solid #f0f0f0;
}

.review-item:last-child {
  border-bottom: none;
}

.review-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.review-user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.review-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
}

.review-name {
  font-size: 14px;
  font-weight: 500;
  color: #333;
}

.review-stars {
  font-size: 14px;
}

.review-content {
  font-size: 14px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 8px;
}

.review-time {
  font-size: 12px;
  color: #999;
}

.empty {
  text-align: center;
  color: #999;
  padding: 40px;
  font-size: 14px;
}

/* 侧边栏 */
.sidebar {
  position: sticky;
  top: 88px;
  align-self: flex-start;
}

.order-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.order-title {
  font-size: 18px;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 20px;
  text-align: center;
}

.order-provider {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.order-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  object-fit: cover;
}

.order-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.order-rank {
  font-size: 13px;
  color: #6c5ce7;
  margin-top: 2px;
}

.order-price-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.order-price-label {
  font-size: 14px;
  color: #999;
}

.order-price-value {
  font-size: 24px;
  font-weight: 700;
  color: #f5222d;
}

.order-btn-large {
  width: 100%;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 14px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 12px;
}

.order-btn-large:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(108,92,231,0.4);
}

.order-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
}
</style>
