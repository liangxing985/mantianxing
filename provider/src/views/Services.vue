<template>
  <div>
    <van-nav-bar title="服务定价" left-arrow @click-left="$router.back()" />
    <div class="level-card">
      <div class="level-info">
        <span class="level-label">当前段位</span>
        <span class="level-value">{{ profile?.rank || '未设置' }}</span>
      </div>
      <div class="level-info" style="margin-top:8px;">
        <span class="level-label">当前等级</span>
        <span class="level-value">Lv.{{ profile?.level || 1 }}</span>
        <span class="level-tip-inline">（接单量 {{ profile?.orderCount || 0 }} 单）</span>
      </div>
      <p class="level-tip">价格由平台按段位统一设置，陪玩端仅可查看，如需调整请联系运营</p>
    </div>

    <van-cell-group inset style="margin-top: 12px;">
      <div v-for="item in priceList" :key="item.gameId" class="service-item">
        <div class="svc-info">
          <div class="svc-name">{{ item.gameName }}</div>
          <div class="svc-game">陪玩服务 · 按小时</div>
        </div>
        <div class="svc-price">
          <span class="price-num">{{ item.pricePerHour }}</span>
          <span class="price-unit">星石/小时</span>
        </div>
      </div>
    </van-cell-group>
    <van-empty v-if="priceList.length === 0" description="暂无定价，请联系运营配置" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMyProfile, getPricingByRank } from '@/api'

const profile = ref<any>(null)
const priceList = ref<any[]>([])

const loadData = async () => {
  try {
    const res: any = await getMyProfile()
    const data = res.data || res
    profile.value = data?.providerProfile || data || {}
    // 根据段位获取定价
    const rank = profile.value?.rank
    if (rank) {
      const pricingRes: any = await getPricingByRank(rank)
      priceList.value = pricingRes.data || pricingRes || []
    }
  } catch (e) {}
}
onMounted(loadData)
</script>
<style scoped>
.level-card { background: linear-gradient(135deg, #667eea, #764ba2); color: #fff; padding: 20px 16px; margin: 12px; border-radius: 12px; }
.level-info { display: flex; align-items: center; gap: 12px; }
.level-label { font-size: 14px; opacity: 0.9; }
.level-value { font-size: 22px; font-weight: 700; }
.level-tip-inline { font-size: 12px; opacity: 0.8; }
.level-tip { font-size: 12px; opacity: 0.8; margin-top: 12px; }
.service-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
.svc-name { font-size: 15px; font-weight: 600; }
.svc-game { font-size: 12px; color: #999; margin-top: 2px; }
.svc-price { text-align: right; }
.price-num { font-size: 20px; font-weight: 700; color: #ff6b35; }
.price-unit { font-size: 12px; color: #999; margin-left: 4px; }
</style>
