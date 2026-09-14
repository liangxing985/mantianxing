<template>
  <div class="membership-page">
    <div class="header">
      <div class="title">漫天星会员</div>
      <div v-if="myMembership.isActive" class="current">
        当前：{{ levelName(myMembership.level) }} · 到期 {{ formatDate(myMembership.expireAt) }}
      </div>
      <div v-else class="current">未开通会员</div>
    </div>
    <div class="level-list">
      <div v-for="lv in levels" :key="lv.id" :class="['level-card', selectedLevel === lv.level && 'selected']" @click="selectedLevel = lv.level">
        <div class="lv-name">{{ lv.name }}</div>
        <div class="lv-price">{{ lv.price }}<span class="unit">星石/月</span></div>
        <div class="lv-benefits" v-html="lv.benefits || '专属标识、优先接单、更多权益'"></div>
      </div>
    </div>
    <div class="purchase">
      <div class="months">
        <div v-for="m in [1, 3, 6, 12]" :key="m" :class="['m-item', months === m && 'active']" @click="months = m">
          {{ m }}个月
        </div>
      </div>
      <div class="total">合计：{{ totalCost }} 星石</div>
      <button class="buy-btn" @click="purchase">立即开通</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'
import { showToast } from 'vant'

const levels = ref<any[]>([])
const myMembership = ref<any>({ isActive: false, level: 0 })
const selectedLevel = ref(1)
const months = ref(1)

const totalCost = computed(() => {
  const lv = levels.value.find(l => l.level === selectedLevel.value)
  return lv ? lv.price * months.value : 0
})

onMounted(async () => {
  const [lvRes, myRes] = await Promise.all([
    request.get('/membership/levels'),
    request.get('/membership/my').catch(() => ({ data: { isActive: false, level: 0 } })),
  ])
  levels.value = lvRes.data || lvRes
  myMembership.value = myRes.data || myRes
  if (levels.value.length > 0) selectedLevel.value = levels.value[0].level
})

function levelName(level: number) {
  const names = ['普通用户', '青铜会员', '白银会员', '黄金会员', '钻石会员', '王者会员']
  return names[level] || '普通用户'
}

function formatDate(d: any) {
  if (!d) return ''
  return new Date(d).toLocaleDateString()
}

async function purchase() {
  try {
    await request.post('/membership/purchase', { level: selectedLevel.value, months: months.value })
    showToast('开通成功')
    const res = await request.get('/membership/my')
    myMembership.value = res.data || res
  } catch (e: any) {
    showToast(e.response?.data?.message || '开通失败')
  }
}
</script>

<style scoped>
.membership-page { min-height: 100vh; background: linear-gradient(180deg, #1a1a2e 0%, #f5f5f5 30%); padding-bottom: 100px; }
.header { padding: 40px 20px 30px; text-align: center; color: #fff; }
.title { font-size: 24px; font-weight: 700; }
.current { font-size: 13px; opacity: 0.8; margin-top: 8px; }
.level-list { display: flex; gap: 10px; padding: 0 16px; overflow-x: auto; }
.level-card { flex: 0 0 140px; background: #fff; border-radius: 12px; padding: 16px; text-align: center; border: 2px solid transparent; cursor: pointer; }
.level-card.selected { border-color: #f5a623; box-shadow: 0 4px 12px rgba(245,166,35,0.3); }
.lv-name { font-size: 16px; font-weight: 600; color: #333; }
.lv-price { font-size: 22px; font-weight: 700; color: #f5a623; margin: 8px 0; }
.lv-price .unit { font-size: 12px; color: #999; font-weight: 400; }
.lv-benefits { font-size: 11px; color: #999; line-height: 1.5; }
.purchase { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 16px; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); }
.months { display: flex; gap: 10px; margin-bottom: 12px; }
.m-item { flex: 1; text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; cursor: pointer; }
.m-item.active { border-color: #1677ff; color: #1677ff; background: #e6f4ff; }
.total { text-align: center; font-size: 16px; margin-bottom: 12px; }
.total { color: #333; }
.buy-btn { width: 100%; padding: 14px; background: linear-gradient(90deg, #f5a623, #f7c948); color: #fff; border: none; border-radius: 24px; font-size: 16px; font-weight: 600; cursor: pointer; }
</style>
