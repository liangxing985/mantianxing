<template>
  <div>
    <van-nav-bar title="选择陪玩" left-arrow @click-left="$router.back()" />
    <van-search v-model="keyword" placeholder="搜索陪玩昵称" @search="loadData" />
    <van-tabs v-model:active="activeGame" @change="onGameChange">
      <van-tab v-for="g in games" :key="g.id" :title="g.name" :name="g.id" />
    </van-tabs>
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData">
      <div v-for="p in list" :key="p.id" class="provider-card" @click="$router.push(`/provider/${p.id}`)">
        <van-image round width="56" height="56" :src="p.avatar || defaultAvatar" />
        <div class="info">
          <div class="name-row">
            <span class="name">{{ p.nickname }}</span>
            <van-tag plain type="warning">Lv.{{ p.providerProfile?.level }}</van-tag>
            <span v-if="p.providerProfile?.isOnline" class="online">在线</span>
          </div>
          <div class="desc">{{ p.bio || '暂无简介' }}</div>
          <div class="meta">
            <span>⭐ {{ p.providerProfile?.rating?.toFixed(1) }}</span>
            <span>{{ p.providerProfile?.orderCount || 0 }}单</span>
            <span class="price">{{ getMinPrice(p) }}星石/时起</span>
          </div>
        </div>
      </div>
    </van-list>
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
  } else if (games.value.length > 0) {
    activeGame.value = games.value[0].id
  }
}

const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getProviderList({
      page: page.value,
      pageSize: 20,
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

const onGameChange = () => {
  page.value = 1
  list.value = []
  finished.value = false
  loadData()
}

const getMinPrice = (p: any) => {
  const services = p.providerProfile?.services || []
  return services.length ? Math.min(...services.map((s: any) => s.price)) : 0
}

onMounted(loadGames)
</script>

<style scoped>
.provider-card {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.info { flex: 1; margin-left: 12px; }
.name-row { display: flex; align-items: center; gap: 8px; }
.name { font-size: 15px; font-weight: 600; }
.online { font-size: 11px; color: #52c41a; }
.desc { font-size: 12px; color: #999; margin: 4px 0; }
.meta { display: flex; gap: 12px; font-size: 12px; color: #666; }
.price { color: #f5576c; font-weight: 600; }
</style>
