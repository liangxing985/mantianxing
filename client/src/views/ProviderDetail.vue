<template>
  <div v-if="provider" class="detail-page">
    <div class="header">
      <van-nav-bar title="陪玩详情" left-arrow @click-left="$router.back()" fixed />
      <div class="profile">
        <van-image round width="80" height="80" :src="provider.avatar || defaultAvatar" />
        <div class="info">
          <h2>{{ provider.nickname }}</h2>
          <div class="tags">
            <van-tag plain type="warning">Lv.{{ profile.level }}</van-tag>
            <van-tag v-if="profile.rank" type="danger">{{ profile.rank }}</van-tag>
            <van-tag v-if="profile.isOnline" type="success">在线接单</van-tag>
            <van-tag v-else type="default">离线</van-tag>
          </div>
          <p class="bio">{{ provider.bio || '这个人很懒，什么都没写' }}</p>
          <div v-if="profile.games?.length" class="game-tags">
            <van-tag v-for="g in profile.games" :key="g.id" plain type="primary" size="medium">{{ g.game?.name }}</van-tag>
          </div>
        </div>
      </div>
    </div>

    <div class="stats">
      <div class="stat-item">
        <div class="num">{{ profile.rating?.toFixed(1) || '5.0' }}</div>
        <div class="label">评分</div>
      </div>
      <div class="stat-item">
        <div class="num">{{ profile.orderCount || 0 }}</div>
        <div class="label">完成订单</div>
      </div>
      <div class="stat-item">
        <div class="num">{{ profile.ratingCount || 0 }}</div>
        <div class="label">评价数</div>
      </div>
    </div>

    <div class="section">
      <h3>服务项目</h3>
      <div v-if="profile.pricedServices && profile.pricedServices.length > 0">
        <div v-for="svc in profile.pricedServices" :key="svc.id" class="service-item">
          <div class="svc-info">
            <span class="svc-name">{{ svc.name }}</span>
            <span class="svc-game">{{ svc.gameName }}</span>
          </div>
          <div class="svc-price">
            <span v-if="svc.price > 0">{{ svc.price }} 星石/{{ unitText(svc.unit) }}</span>
            <span v-else style="color:#999;font-size:13px;">待定价</span>
          </div>
        </div>
      </div>
      <div v-else class="empty">暂无服务项目</div>
    </div>

    <div class="section">
      <h3>最近评价</h3>
      <div v-if="reviews.length === 0" class="empty">暂无评价</div>
      <div v-for="r in reviews" :key="r.id" class="review-item">
        <div class="review-header">
          <span>{{ r.customer?.nickname || '匿名用户' }}</span>
          <span class="stars">{{ '⭐'.repeat(r.rating) }}</span>
        </div>
        <p>{{ r.comment }}</p>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="balance">余额: {{ wallet?.balance || 0 }} 星石</div>
      <van-button type="primary" round @click="goOrder">立即下单</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
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
const goOrder = () => router.push({ path: '/order/create', query: { providerId: route.params.id } })

onMounted(loadData)
</script>

<style scoped>
.detail-page { padding-bottom: 70px; }
.header { background: linear-gradient(135deg, #6c5ce7, #a29bfe); padding-top: 46px; }
.profile { display: flex; padding: 20px 16px; color: #fff; }
.info { margin-left: 16px; }
.info h2 { font-size: 20px; margin-bottom: 6px; }
.tags { display: flex; gap: 6px; margin-bottom: 8px; }
.bio { font-size: 13px; opacity: 0.9; }
.game-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.stats { display: flex; background: #fff; margin: -16px 12px 0; border-radius: 12px; padding: 16px 0; position: relative; z-index: 1; }
.stat-item { flex: 1; text-align: center; }
.stat-item .num { font-size: 20px; font-weight: 600; color: #333; }
.stat-item .label { font-size: 12px; color: #999; margin-top: 4px; }
.section { background: #fff; margin: 12px; border-radius: 12px; padding: 16px; }
.section h3 { font-size: 15px; margin-bottom: 12px; }
.service-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.svc-name { font-size: 14px; }
.svc-game { font-size: 12px; color: #999; margin-left: 8px; }
.svc-price { color: #f5576c; font-weight: 600; }
.review-item { padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.review-header { display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 4px; }
.review-item p { font-size: 13px; color: #333; }
.empty { text-align: center; color: #999; padding: 20px; font-size: 13px; }
.bottom-bar {
  position: fixed; bottom: 0; left: 0; right: 0;
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; background: #fff; border-top: 1px solid #eee;
}
.balance { font-size: 14px; color: #666; }
</style>
