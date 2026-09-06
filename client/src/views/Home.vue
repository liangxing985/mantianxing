<template>
  <div class="home-page">
    <!-- 顶部横幅 -->
    <div class="banner">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getGameList, getProviderList } from '@/api'

const router = useRouter()
const games = ref<any[]>([])
const providers = ref<any[]>([])
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadData = async () => {
  const [g, p]: any = await Promise.all([
    getGameList(),
    getProviderList({ page: 1, pageSize: 10, isOnline: true }),
  ])
  games.value = g
  providers.value = p.list || []
}

const goProviders = (gameId: number) => {
  router.push({ path: '/providers', query: { gameId } })
}

const getMinPrice = (p: any) => {
  const services = p.providerProfile?.services || []
  if (services.length === 0) return 0
  return Math.min(...services.map((s: any) => s.price))
}

onMounted(loadData)
</script>

<style scoped>
.banner {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  padding: 30px 20px;
  color: #fff;
}
.banner h2 { font-size: 22px; margin-bottom: 4px; }
.banner p { font-size: 13px; opacity: 0.9; }
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
.game-item {
  text-align: center;
  font-size: 12px;
  color: #333;
}
.game-icon {
  width: 44px;
  height: 44px;
  line-height: 44px;
  margin: 0 auto 6px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  color: #fff;
  border-radius: 12px;
  font-size: 18px;
  font-weight: bold;
}
.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 16px 8px;
  font-size: 16px;
  font-weight: 600;
}
.more { font-size: 12px; color: #999; font-weight: normal; }
.provider-list { padding: 0 12px; }
.provider-card {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 10px;
  position: relative;
}
.info { flex: 1; margin-left: 12px; }
.name-row { display: flex; align-items: center; gap: 8px; }
.name { font-size: 15px; font-weight: 600; }
.desc { font-size: 12px; color: #999; margin: 4px 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.meta { display: flex; gap: 12px; font-size: 12px; color: #666; }
.price { color: #f5576c; font-weight: 600; }
.online-dot {
  width: 10px; height: 10px; border-radius: 50%;
  background: #ccc;
}
.online-dot.online { background: #52c41a; }
</style>
