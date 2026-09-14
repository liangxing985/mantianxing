<template>
  <div class="rank-page">
    <div class="tabs">
      <div :class="['tab', activeTab === 'income' && 'active']" @click="switchTab('income')">收入榜</div>
      <div :class="['tab', activeTab === 'order' && 'active']" @click="switchTab('order')">接单榜</div>
      <div :class="['tab', activeTab === 'rating' && 'active']" @click="switchTab('rating')">好评榜</div>
      <div :class="['tab', activeTab === 'gift' && 'active']" @click="switchTab('gift')">收礼榜</div>
    </div>
    <div class="rank-list">
      <div v-for="(item, idx) in list" :key="item.id || idx" class="rank-item" @click="goProvider(item)">
        <div :class="['rank-num', idx < 3 && `top${idx + 1}`]">{{ idx + 1 }}</div>
        <img :src="item.user?.avatar || item.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <div class="name">{{ item.user?.nickname || item.nickname }}</div>
          <div class="sub">
            <span v-if="activeTab === 'income'">收入 {{ item.totalIncome }} 星石</span>
            <span v-else-if="activeTab === 'order'">接单 {{ item.orderCount }} 单</span>
            <span v-else-if="activeTab === 'rating'">评分 {{ item.rating?.toFixed(1) }} ({{ item.ratingCount }}评)</span>
            <span v-else>收礼 {{ item.totalGiftsReceived }} 星石</span>
          </div>
        </div>
      </div>
      <div v-if="list.length === 0" class="empty">暂无数据</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const activeTab = ref('income')
const list = ref<any[]>([])
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23ddd"/></svg>'

onMounted(() => loadRank())

async function switchTab(tab: string) {
  activeTab.value = tab
  await loadRank()
}

async function loadRank() {
  const res = await request.get(`/rank/${activeTab.value}`)
  list.value = res.data || res
}

function goProvider(item: any) {
  const id = item.user?.id || item.userId || item.id
  if (id) router.push(`/provider/${id}`)
}
</script>

<style scoped>
.rank-page { min-height: 100vh; background: #f5f5f5; }
.tabs { display: flex; background: #fff; position: sticky; top: 0; z-index: 10; }
.tab { flex: 1; text-align: center; padding: 14px 0; font-size: 14px; color: #666; cursor: pointer; border-bottom: 2px solid transparent; }
.tab.active { color: #1677ff; border-bottom-color: #1677ff; font-weight: 600; }
.rank-list { padding: 8px 0; }
.rank-item { display: flex; align-items: center; padding: 14px 16px; background: #fff; margin-bottom: 1px; cursor: pointer; }
.rank-num { width: 32px; text-align: center; font-size: 16px; font-weight: 700; color: #999; margin-right: 12px; }
.rank-num.top1 { color: #ffd700; }
.rank-num.top2 { color: #c0c0c0; }
.rank-num.top3 { color: #cd7f32; }
.avatar { width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; }
.info { flex: 1; }
.name { font-size: 15px; font-weight: 500; }
.sub { font-size: 12px; color: #999; margin-top: 4px; }
.empty { text-align: center; color: #999; padding: 60px 0; }
</style>
