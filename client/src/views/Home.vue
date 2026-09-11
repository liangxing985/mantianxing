<template>
  <div class="home-page">
    <!-- 活动 Banner 轮播 -->
    <div class="banner-section">
      <van-swipe v-if="activities.length > 0" class="activity-swipe" :autoplay="4000" indicator-color="#fff">
        <van-swipe-item v-for="act in activities" :key="act.id" @click="onActivityClick(act)">
          <div class="activity-banner" :style="act.image ? { backgroundImage: `url(${act.image})` } : {}">
            <div class="activity-overlay">
              <div class="activity-title">{{ act.title }}</div>
              <div v-if="act.content" class="activity-desc">{{ act.content }}</div>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
      <!-- 无活动时显示默认横幅 -->
      <div v-else class="main-banner">
        <div class="banner-content">
          <h1>漫天星电竞</h1>
          <p class="banner-subtitle">专业陪玩 · 技术上分 · 声音好听</p>
          <div class="banner-stats">
            <div class="stat-item">
              <span class="stat-num">{{ providerCount }}</span>
              <span class="stat-label">认证陪玩</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">{{ orderCount }}</span>
              <span class="stat-label">完成订单</span>
            </div>
            <div class="stat-item">
              <span class="stat-num">4.9</span>
              <span class="stat-label">平均评分</span>
            </div>
          </div>
        </div>
        <div class="banner-decoration">
          <div class="deco-star star1">★</div>
          <div class="deco-star star2">★</div>
          <div class="deco-star star3">★</div>
        </div>
      </div>
    </div>

    <div class="container">
      <!-- 游戏分类 -->
      <div class="section">
        <h2 class="section-title">热门游戏</h2>
        <div class="game-grid">
          <div v-for="game in games" :key="game.id" class="game-card" @click="goProviders(game.id)">
            <div class="game-icon">{{ game.name.charAt(0) }}</div>
            <div class="game-name">{{ game.name }}</div>
            <div v-if="game.category" class="game-category">{{ game.category }}</div>
          </div>
        </div>
      </div>

      <!-- 精选商品 -->
      <div v-if="products.length > 0" class="section">
        <h2 class="section-title">
          <span>精选商品</span>
          <span class="coin-rate">1元 = {{ coinRate }}星石</span>
        </h2>
        <div class="product-grid">
          <div v-for="p in products" :key="p.id" class="product-card" @click="onProductClick(p)">
            <div class="product-img" :style="p.image ? { backgroundImage: `url(${p.image})` } : {}">
              <span v-if="!p.image" class="product-placeholder">{{ p.name.charAt(0) }}</span>
              <span v-if="p.category==='hot'" class="product-tag tag-hot">热门</span>
              <span v-else-if="p.category==='discount'" class="product-tag tag-discount">折扣</span>
            </div>
            <div class="product-info">
              <div class="product-name">{{ p.name }}</div>
              <div v-if="p.description" class="product-desc">{{ p.description }}</div>
              <div class="product-bottom">
                <div class="product-price">
                  <span class="price-num">{{ p.price }}</span>
                  <span class="price-unit">星石</span>
                  <span v-if="p.originalPrice" class="price-original">{{ p.originalPrice }}</span>
                </div>
                <button class="buy-btn">立即下单</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 热门陪玩 -->
      <div class="section">
        <h2 class="section-title">
          <span>热门陪玩</span>
          <span class="more" @click="$router.push('/providers')">查看全部 ></span>
        </h2>
        <div class="provider-grid">
          <div v-for="p in providers" :key="p.id" class="provider-card" @click="$router.push(`/provider/${p.id}`)">
            <div class="provider-header">
              <img :src="p.avatar || defaultAvatar" class="provider-avatar" />
              <div class="online-badge" :class="{ online: p.providerProfile?.isOnline }">
                {{ p.providerProfile?.isOnline ? '在线' : '离线' }}
              </div>
            </div>
            <div class="provider-body">
              <div class="provider-name-row">
                <span class="provider-name">{{ p.nickname }}</span>
                <span class="level-tag">Lv.{{ p.providerProfile?.level }}</span>
                <span v-if="p.providerProfile?.rank" class="rank-tag">{{ p.providerProfile?.rank }}</span>
              </div>
              <div class="provider-desc">{{ p.bio || '这个人很懒，什么都没写' }}</div>
              <div class="provider-meta">
                <span class="meta-item">⭐ {{ p.providerProfile?.rating?.toFixed(1) || '5.0' }}</span>
                <span class="meta-item">{{ p.providerProfile?.orderCount || 0 }}单</span>
              </div>
              <div class="provider-price">
                <span class="price-num">{{ getMinPrice(p) }}</span>
                <span class="price-unit">星石/时起</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getGameList, getProviderList, getPublicConfig, getProductList, getActivityList } from '@/api'

const router = useRouter()
const games = ref<any[]>([])
const providers = ref<any[]>([])
const products = ref<any[]>([])
const activities = ref<any[]>([])
const coinRate = ref(10)
const providerCount = ref(0)
const orderCount = ref(0)
const theme = reactive({ primaryColor: '#6c5ce7', accentColor: '#a29bfe' })
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadData = async () => {
  try {
    const [cfg, g, p, prod, act]: any = await Promise.all([
      getPublicConfig().catch(() => ({})),
      getGameList(),
      getProviderList({ page: 1, pageSize: 8, online: true }),
      getProductList().catch(() => []),
      getActivityList().catch(() => []),
    ])
    if (cfg?.theme) Object.assign(theme, cfg.theme)
    if (cfg?.coinExchangeRate) coinRate.value = cfg.coinExchangeRate
    games.value = g || []
    providers.value = p?.list || []
    providerCount.value = p?.total || 0
    products.value = Array.isArray(prod) ? prod : (prod?.data || [])
    activities.value = Array.isArray(act) ? act : (act?.data || [])
  } catch (e) {
    console.error('loadData error', e)
  }
}

const goProviders = (gameId: number) => {
  router.push({ path: '/providers', query: { gameId } })
}

const onActivityClick = (act: any) => {
  if (act.linkUrl) {
    window.open(act.linkUrl, '_blank')
  }
}

const onProductClick = (p: any) => {
  const token = localStorage.getItem('client_token')
  if (!token) {
    router.push('/login')
    return
  }
  router.push({ path: '/order/create', query: { productId: p.id, productName: p.name, price: p.price } })
}

const getMinPrice = (p: any) => {
  if (p.providerProfile?.minPrice && p.providerProfile.minPrice > 0) {
    return p.providerProfile.minPrice
  }
  const services = p.providerProfile?.services || []
  if (services.length === 0) return 0
  return Math.min(...services.map((s: any) => s.price))
}

onMounted(loadData)
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #f0f2f5;
}

/* Banner 区域 */
.banner-section {
  margin-bottom: 32px;
}

.activity-swipe {
  border-radius: 16px;
  overflow: hidden;
  margin: 0 24px;
}

.activity-banner {
  height: 320px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
}

.activity-overlay {
  width: 100%;
  padding: 40px;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  color: #fff;
}

.activity-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
}

.activity-desc {
  font-size: 16px;
  opacity: 0.9;
}

/* 默认横幅 */
.main-banner {
  height: 320px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  margin: 0 24px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 60px;
  position: relative;
  overflow: hidden;
}

.banner-content {
  color: #fff;
  z-index: 1;
}

.banner-content h1 {
  font-size: 48px;
  font-weight: 800;
  margin-bottom: 12px;
  letter-spacing: 2px;
}

.banner-subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 32px;
}

.banner-stats {
  display: flex;
  gap: 48px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-num {
  font-size: 32px;
  font-weight: 700;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
  margin-top: 4px;
}

.banner-decoration {
  position: absolute;
  right: 60px;
  top: 50%;
  transform: translateY(-50%);
}

.deco-star {
  position: absolute;
  color: rgba(255,255,255,0.15);
  font-size: 80px;
}

.star1 { top: -60px; right: 0; font-size: 100px; }
.star2 { top: 40px; right: 80px; font-size: 60px; }
.star3 { bottom: -40px; right: 40px; font-size: 70px; }

/* 容器 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
}

/* 区块 */
.section {
  margin-bottom: 40px;
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.section-title .more {
  font-size: 14px;
  color: #6c5ce7;
  font-weight: normal;
  cursor: pointer;
}

.section-title .more:hover {
  text-decoration: underline;
}

.coin-rate {
  font-size: 14px;
  color: #999;
  font-weight: normal;
  background: #fff;
  padding: 4px 12px;
  border-radius: 16px;
}

/* 游戏分类 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 16px;
}

.game-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.game-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.game-icon {
  width: 56px;
  height: 56px;
  line-height: 56px;
  margin: 0 auto 12px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border-radius: 16px;
  font-size: 24px;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(108,92,231,0.3);
}

.game-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.game-category {
  font-size: 12px;
  color: #999;
}

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.product-img {
  height: 160px;
  background: linear-gradient(135deg, #f0f0f0, #e0e0e0);
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-placeholder {
  font-size: 48px;
  color: #bbb;
  font-weight: bold;
}

.product-tag {
  position: absolute;
  top: 12px;
  left: 12px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.tag-hot {
  background: #fff1f0;
  color: #f5222d;
}

.tag-discount {
  background: #fff7e6;
  color: #fa8c16;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.product-price {
  display: flex;
  align-items: baseline;
}

.price-num {
  font-size: 22px;
  font-weight: 700;
  color: #f5222d;
}

.price-unit {
  font-size: 13px;
  color: #f5222d;
  margin-left: 2px;
}

.price-original {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

.buy-btn {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.buy-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(108,92,231,0.4);
}

/* 陪玩网格 */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.provider-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.provider-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
}

.provider-header {
  position: relative;
  height: 120px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.provider-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #fff;
  object-fit: cover;
}

.online-badge {
  position: absolute;
  bottom: 8px;
  right: 12px;
  padding: 2px 10px;
  border-radius: 12px;
  font-size: 12px;
  background: rgba(0,0,0,0.4);
  color: #fff;
}

.online-badge.online {
  background: rgba(82,196,26,0.9);
}

.provider-body {
  padding: 16px;
}

.provider-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.provider-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.level-tag {
  background: #fff7e6;
  color: #fa8c16;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.rank-tag {
  background: #f5f3ff;
  color: #6c5ce7;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.provider-desc {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.provider-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #666;
  margin-bottom: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.provider-price {
  display: flex;
  align-items: baseline;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.provider-price .price-num {
  font-size: 20px;
  font-weight: 700;
  color: #f5222d;
}

.provider-price .price-unit {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}
</style>
