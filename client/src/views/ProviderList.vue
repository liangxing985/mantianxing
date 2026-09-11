<template>
  <div class="provider-list-page">
    <div class="page-header">
      <h1 class="page-title">陪玩大厅</h1>
      <p class="page-subtitle">选择你心仪的陪玩，开启快乐游戏时光</p>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <div class="filter-left">
        <span class="filter-label">游戏：</span>
        <div class="game-tabs">
          <span 
            class="game-tab" 
            :class="{ active: !activeGame }" 
            @click="selectGame(undefined)"
          >全部</span>
          <span 
            v-for="g in games" 
            :key="g.id" 
            class="game-tab" 
            :class="{ active: activeGame === g.id }"
            @click="selectGame(g.id)"
          >{{ g.name }}</span>
        </div>
      </div>
      <div class="filter-right">
        <input 
          v-model="keyword" 
          class="search-input" 
          placeholder="搜索陪玩昵称" 
          @keyup.enter="onSearch"
        />
        <button class="search-btn" @click="onSearch">搜索</button>
      </div>
    </div>

    <!-- 陪玩网格 -->
    <div class="provider-grid">
      <div v-for="p in list" :key="p.id" class="provider-card" @click="$router.push(`/provider/${p.id}`)">
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
            <span v-if="p.providerProfile?.gender" class="meta-item">
              {{ p.providerProfile.gender === 'MALE' ? '♂' : '♀' }}
            </span>
          </div>
          <div class="provider-price">
            <span class="price-num">{{ getMinPrice(p) }}</span>
            <span class="price-unit">星石/时起</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 加载更多 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="finished && list.length > 0" class="finished">没有更多了</div>
    <div v-else-if="list.length === 0" class="empty">暂无陪玩数据</div>
    
    <div v-if="!finished && list.length > 0" class="load-more">
      <button class="load-more-btn" @click="loadData" :disabled="loading">
        {{ loading ? '加载中...' : '加载更多' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getGameList, getProviderList } from '@/api'

const route = useRoute()
const games = ref<any[]>([])
const list = ref<any[]>([])
const loading = ref(false)
const finished = ref(false)
const page = ref(1)
const keyword = ref('')
const activeGame = ref<number | undefined>(undefined)
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

const loadGames = async () => {
  games.value = await getGameList() as any
  if (route.query.gameId) {
    activeGame.value = Number(route.query.gameId)
  }
  loadData()
}

const selectGame = (gameId: number | undefined) => {
  activeGame.value = gameId
  page.value = 1
  list.value = []
  finished.value = false
  loadData()
}

const onSearch = () => {
  page.value = 1
  list.value = []
  finished.value = false
  loadData()
}

const loadData = async () => {
  if (loading.value) return
  loading.value = true
  try {
    const res: any = await getProviderList({
      page: page.value,
      pageSize: 12,
      gameId: activeGame.value,
      keyword: keyword.value,
    })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total
    page.value++
  } finally {
    loading.value = false
  }
}

const getMinPrice = (p: any) => {
  if (p.providerProfile?.minPrice && p.providerProfile.minPrice > 0) {
    return p.providerProfile.minPrice
  }
  const services = p.providerProfile?.services || []
  if (services.length === 0) return 0
  return Math.min(...services.map((s: any) => s.price))
}

onMounted(loadGames)
</script>

<style scoped>
.provider-list-page {
  min-height: 100vh;
}

.page-header {
  text-align: center;
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: #999;
}

/* 筛选栏 */
.filter-bar {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.game-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.game-tab {
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  background: #f5f5f5;
}

.game-tab:hover {
  background: #f0f0f0;
}

.game-tab.active {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  font-weight: 500;
}

.filter-right {
  display: flex;
  gap: 8px;
}

.search-input {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  width: 240px;
  outline: none;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: #6c5ce7;
}

.search-btn {
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.search-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(108,92,231,0.4);
}

/* 陪玩网格 */
.provider-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
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

.price-num {
  font-size: 22px;
  font-weight: 700;
  color: #f5222d;
}

.price-unit {
  font-size: 12px;
  color: #999;
  margin-left: 4px;
}

/* 加载状态 */
.loading, .finished, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 14px;
}

.load-more {
  text-align: center;
  margin-top: 24px;
}

.load-more-btn {
  background: #fff;
  color: #6c5ce7;
  border: 1px solid #6c5ce7;
  padding: 10px 40px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.load-more-btn:hover:not(:disabled) {
  background: #f5f3ff;
}

.load-more-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
