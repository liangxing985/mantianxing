<template>
  <div>
    <van-nav-bar title="服务定价" left-arrow @click-left="$router.back()" />
    <van-cell-group inset style="margin-top: 12px;">
      <div v-for="svc in services" :key="svc.id" class="service-item">
        <div class="svc-info">
          <div class="svc-name">{{ svc.serviceItem?.name }}</div>
          <div class="svc-game">{{ svc.serviceItem?.game?.name }} · {{ unitText(svc.unit) }}</div>
        </div>
        <div class="svc-right">
          <van-stepper v-model="svc.price" :min="1" :max="9999" @change="(v: number) => updatePrice(svc, v)" />
          <van-switch :model-value="svc.isEnabled" size="20" @change="(v: boolean) => toggleSvc(svc, v)" />
        </div>
      </div>
    </van-cell-group>
    <van-empty v-if="services.length === 0" description="暂无服务项目，请联系运营添加" />
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showSuccessToast } from 'vant'
import { getMyServices, updateServicePrice, toggleService } from '@/api'
const services = ref<any[]>([])
const loadData = async () => { services.value = await getMyServices() as any }
const updatePrice = async (svc: any, price: number) => {
  await updateServicePrice(svc.id, price); showSuccessToast('价格已更新')
}
const toggleSvc = async (svc: any, enabled: boolean) => {
  await toggleService(svc.id, enabled); svc.isEnabled = enabled
}
const unitText = (u: string) => ({ hour: '按小时', game: '按局', package: '包段' }[u] || u)
onMounted(loadData)
</script>
<style scoped>
.service-item { display: flex; justify-content: space-between; align-items: center; padding: 14px 16px; border-bottom: 1px solid #f5f5f5; }
.svc-name { font-size: 15px; font-weight: 600; }
.svc-game { font-size: 12px; color: #999; margin-top: 2px; }
.svc-right { display: flex; align-items: center; gap: 12px; }
</style>
