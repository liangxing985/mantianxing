<template>
  <div class="home-page" :style="{ '--theme-primary': theme.primaryColor, '--theme-accent': theme.accentColor, '--theme-bg': theme.bgColor }">
    <!-- 活动 Banner 轮播 -->
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
    <div v-else class="banner" :style="{ background: `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }">
      <div class="banner-content">
        <h2>漫天星电竞</h2>
        <p>专业陪玩 · 技术上分 · 声音好听</p>
      </div>
    </div>

    <!-- 游戏分类 -->
    <div class="game-grid">
      <div v-for="game in games" :key="game.id" class="game-item" @click="goProviders(game.id)">
        <div class="game-icon">{{ game.name.charAt(0) }}</div>
        <span>{{ game.name }}</span>
      </div>
    </div>

    <!-- 商品展示 -->
    <div v-if="products.length > 0" class="section-title">
      <span>精选商品</span>
      <span class="more">1元={{ coinRate }}星石</span>
    </div>
    <div v-if="products.length > 0" class="product-grid">
      <div v-for="p in products" :key="p.id" class="product-card" @click="onProductClick(p)">
        <div class="product-img" :style="p.image ? { backgroundImage: `url(${p.image})` } : {}">
          <span v-if="!p.image" class="product-placeholder">{{ p.name.charAt(0) }}</span>
          <van-tag v-if="p.category==='hot'" type="danger" class="product-tag">热门</van-tag>
          <van-tag v-else-if="p.category==='discount'" type="warning" class="product-tag">折扣</van-tag>
        </div>
        <div class="product-info">
          <div class="product-name">{{ p.name }}</div>
          <div class="product-price">
            <span class="price-num">{{ p.price }}</span>
            <span class="price-unit">星石</span>
            <span v-if="p.originalPrice" class="price-original">{{ p.originalPrice }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 推荐陪玩 -->
    <div class="section-title">
      <span>热门陪玩</span>
      <span class="more" @click="$router.push('/providers')">查看全部 ></span>
    </div>

    <div class="provider-list">
      <div v-for="p in providers" :key="p.id" class="provider-card" @click="$router.push(`/provider/${p.id}`)">
        <van-image round width="60" height="60" :src="p.avatar || defaultAvatar" />
        <div class="info">
          <div class="name-row">
            <span class="name">{{ p.nickname }}</span>
            <van-tag plain type="warning">Lv.{{ p.providerProfile?.level }}</van-tag>
            <van-tag v-if="p.providerProfile?.rank" type="danger">{{ p.providerProfile.rank }}</van-tag>
          </div>
          <div class="desc">{{ p.bio || '这个人很懒，什么都没写' }}</div>
          <div class="meta">
            <span>⭐ {{ p.providerProfile?.rating?.toFixed(1) || '5.0' }}</span>
            <span>{{ p.providerProfile?.orderCount || 0 }}单</span>
            <span class="price">{{ getMinPrice(p) }}星石/时起</span>
          </div>
        </div>
        <div class="online-dot" :class="{ online: p.providerProfile?.isOnline }"></div>
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
const theme = reactive({ primaryColor: '#1a1a2e', accentColor: '#e94560', bgColor: '#0f0f1a' })
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadData = async () => {
  try {
    const [cfg, g, p, prod, act]: any = await Promise.all([
      getPublicConfig().catch(() => ({})),
      getGameList(),
      getProviderList({ page: 1, pageSize: 10, isOnline: true }),
      getProductList().catch(() => []),
      getActivityList().catch(() => []),
    ])
    if (cfg?.theme) Object.assign(theme, cfg.theme)
    if (cfg?.coinExchangeRate) coinRate.value = cfg.coinExchangeRate
    games.value = g || []
    providers.value = p?.list || []
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
  // MVP：点击商品跳转到下单页，预填商品信息
  router.push({ path: '/order/create', query: { productId: p.id, productName: p.name, price: p.price } })
}

const getMinPrice = (p: any) => {
  const services = p.providerProfile?.services || []
  if (services.length === 0) return 0
  return Math.min(...services.map((s: any) => s.price))
}

onMounted(loadData)
</script>

<style scoped>
.home-page { min-height: 100vh; background: var(--theme-bg, #f5f5f5); padding-bottom: 20px; }

/* 活动轮播 */
.activity-swipe { margin: 0; }
.activity-banner {
  height: 160px;
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: flex-end;
}
.activity-overlay {
  width: 100%;
  padding: 20px 16px 16px;
  background: linear-gradient(transparent, rgba(0,0,0,0.6));
  color: #fff;
}
.activity-title { font-size: 18px; font-weight: 600; margin-bottom: 4px; }
.activity-desc { font-size: 12px; opacity: 0.9; }

/* 默认横幅 */
.banner { padding: 30px 20px; color: #fff; }
.banner h2 { font-size: 22px; margin-bottom: 4px; }
.banner p { font-size: 13px; opacity: 0.9; }

/* 游戏分类 */
.game-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  padding: 16px;
  background: #fff;
  margin: -20px 12px 0;
  border-radius: 12px;
  position: relative;
  z-index: 1;
}
.game-item { text-align: center; font-size: 12px; color: #333; }
.game-icon {
  width: 44px; height: 44px; line-height: 44px;
  margin: 0 auto 6px;
  background: linear-gradient(135deg, var(--theme-accent, #f5576c), #f093fb);
  color: #fff; border-radius: 12px;
  font-size: 18px; font-weight: bold;
}

/* 区块标题 */
.section-title {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 16px 8px; font-size: 16px; font-weight: 600; color: #fff;
}
.more { font-size: 12px; color: rgba(255,255,255,0.6); font-weight: normal; }

/* 商品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 0 12px;
}
.product-card {
  background: #fff;
  border-radius: 12px;
  overflow: hidden;
}
.product-img {
  height: 100px;
  background: linear-gradient(135deg, #eee, #ddd);
  background-size: cover;
  background-position: center;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.product-placeholder { font-size: 28px; color: #999; font-weight: bold; }
.product-tag { position: absolute; top: 6px; left: 6px; }
.product-info { padding: 8px 10px; }
.product-name { font-size: 13px; font-weight: 600; margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.product-price { display: flex; align-items: baseline; gap: 2px; }
.price-num { font-size: 16px; font-weight: 700; color: var(--theme-accent, #e94560); }
.price-unit { font-size: 11px; color: var(--theme-accent, #e94560); }
.price-original { font-size: 11px; color: #999; text-decoration: line-through; margin-left: 4px; }

/* 陪玩列表 */
.provider-list { padding: 0 12px; }
.provider-card {
  display: flex; align-items: center;
  background: #fff; border-radius: 12px;
  padding: 14px; margin-bottom: 10px;
  position: relative;
}
.info { flex: 1; margin-left: 12px; }
.name-row { display: flex; align-items: center; gap: 8px; }
.name { font-size: 15px; font-weight: 600; }
.desc { font-size: 12px; color: #999; margin: 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: flex; gap: 12px; font-size: 12px; color: #666; }
.price { color: var(--theme-accent, #f5576c); font-weight: 600; }
.online-dot { width: 10px; height: 10px; border-radius: 50%; background: #ccc; }
.online-dot.online { background: #52c41a; }
</style>
