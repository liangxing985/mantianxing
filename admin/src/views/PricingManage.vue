<template>
  <div>
    <div class="page-header">
      <span class="page-title">段位定价管理</span>
      <el-button type="primary" @click="saveAll" :loading="saving">保存全部</el-button>
    </div>

    <el-alert type="info" :closable="false" style="margin-bottom:16px;">
      按游戏和陪玩段位设置每小时价格（星石）。陪玩端只能查看，不能修改。陪玩等级根据接单量自动提升。
    </el-alert>

    <div v-for="game in games" :key="game.id" class="game-card">
      <div class="game-header">
        <span class="game-name">{{ game.name }}</span>
        <el-tag size="small">共 {{ getGamePricingCount(game.id) }} 个段位定价</el-tag>
      </div>
      <div class="price-grid">
        <div v-for="rank in rankOptions" :key="rank" class="price-item">
          <span class="rank-label">{{ rank }}</span>
          <el-input-number
            v-model="priceMap[game.id + '_' + rank]"
            :min="0"
            :max="99999"
            size="small"
            controls-position="right"
            style="width:120px;"
          />
          <span class="unit">星石/小时</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getGameList, getAllPricings, batchSavePricings, getSystemConfig } from '@/api'

const loading = ref(false)
const saving = ref(false)
const games = ref<any[]>([])
const rankOptions = ref<string[]>(['王者', '星耀', '钻石', '铂金', '黄金', '白银', '青铜'])
const priceMap = reactive<Record<string, number>>({})

const getGamePricingCount = (gameId: number) => {
  return rankOptions.value.filter((rank) => (priceMap[gameId + '_' + rank] || 0) > 0).length
}

const loadData = async () => {
  loading.value = true
  try {
    // 获取段位配置
    try {
      const configRes: any = await getSystemConfig()
      const configs = configRes.data || configRes || {}
      if (configs.rank_options) {
        rankOptions.value = JSON.parse(configs.rank_options)
      }
    } catch (e) {}

    const [gamesRes, pricingRes]: any[] = await Promise.all([
      getGameList(),
      getAllPricings(),
    ])
    games.value = gamesRes.data || gamesRes || []
    const pricings = pricingRes.data || pricingRes || []
    // 初始化价格
    games.value.forEach((game: any) => {
      rankOptions.value.forEach((rank: string) => {
        const key = game.id + '_' + rank
        const found = pricings.find((p: any) => p.gameId === game.id && p.rank === rank)
        priceMap[key] = found?.pricePerHour || 0
      })
    })
  } finally {
    loading.value = false
  }
}

const saveAll = async () => {
  const items: any[] = []
  games.value.forEach((game: any) => {
    rankOptions.value.forEach((rank: string) => {
      const key = game.id + '_' + rank
      const price = priceMap[key] || 0
      if (price > 0) {
        items.push({ gameId: game.id, rank, pricePerHour: price })
      }
    })
  })
  if (items.length === 0) {
    ElMessage.warning('请至少设置一个价格')
    return
  }
  saving.value = true
  try {
    await batchSavePricings(items)
    ElMessage.success('保存成功')
    loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; }
.game-card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 16px; border: 1px solid #ebeef5; }
.game-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #f0f0f0; }
.game-name { font-size: 16px; font-weight: 600; }
.price-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.price-item { display: flex; align-items: center; gap: 8px; }
.rank-label { font-size: 13px; color: #606266; min-width: 45px; }
.unit { font-size: 12px; color: #909399; }
@media (max-width: 1200px) {
  .price-grid { grid-template-columns: repeat(3, 1fr); }
}
</style>
