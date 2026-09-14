<template>
  <div class="data-dashboard">
    <h2>数据看板</h2>
    <!-- 统计卡片 -->
    <div class="stat-cards">
      <div class="card">
        <div class="label">今日订单</div>
        <div class="value">{{ data.today?.orders || 0 }}</div>
        <div class="sub">金额 {{ data.today?.amount || 0 }} 星石</div>
      </div>
      <div class="card">
        <div class="label">本周订单</div>
        <div class="value">{{ data.week?.orders || 0 }}</div>
        <div class="sub">金额 {{ data.week?.amount || 0 }} 星石</div>
      </div>
      <div class="card">
        <div class="label">本月订单</div>
        <div class="value">{{ data.month?.orders || 0 }}</div>
        <div class="sub">金额 {{ data.month?.amount || 0 }} 星石</div>
      </div>
      <div class="card">
        <div class="label">平台抽成(本月)</div>
        <div class="value">{{ data.month?.platformFee || 0 }}</div>
        <div class="sub">星石</div>
      </div>
    </div>

    <!-- 订单趋势 -->
    <div class="chart-section">
      <h3>近7天订单趋势</h3>
      <div class="chart">
        <div v-for="d in data.orderTrend" :key="d.date" class="bar-item">
          <div class="bar" :style="{ height: (d.count / maxOrder * 100) + '%' }"></div>
          <div class="bar-label">{{ formatDay(d.date) }}</div>
          <div class="bar-value">{{ d.count }}</div>
        </div>
      </div>
    </div>

    <!-- 游戏分布 -->
    <div class="two-col">
      <div class="chart-section">
        <h3>游戏订单分布</h3>
        <div v-for="g in data.gameDistribution" :key="g.name" class="dist-item">
          <span class="dist-name">{{ g.name }}</span>
          <div class="dist-bar"><div :style="{ width: (g.count / maxGame * 100) + '%' }"></div></div>
          <span class="dist-count">{{ g.count }}</span>
        </div>
      </div>
      <div class="chart-section">
        <h3>陪玩收入TOP10</h3>
        <div v-for="(p, i) in data.topProviders" :key="p.id" class="rank-item">
          <span class="rank">{{ i + 1 }}</span>
          <span class="name">{{ p.user?.nickname }}</span>
          <span class="income">{{ p.totalIncome }}星石</span>
        </div>
      </div>
    </div>

    <!-- 提现统计 -->
    <div class="chart-section">
      <h3>提现统计</h3>
      <div class="withdraw-stats">
        <div><span>累计提现笔数：</span><strong>{{ data.withdrawStats?.count || 0 }}</strong></div>
        <div><span>累计提现星石：</span><strong>{{ data.withdrawStats?.amount || 0 }}</strong></div>
        <div><span>累计实际到账：</span><strong>{{ data.withdrawStats?.realAmount?.toFixed(2) || 0 }}元</strong></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import request from '@/utils/request'

const data = ref<any>({ orderTrend: [], gameDistribution: [], topProviders: [] })

const maxOrder = computed(() => Math.max(...(data.value.orderTrend?.map((d: any) => d.count) || [1]), 1))
const maxGame = computed(() => Math.max(...(data.value.gameDistribution?.map((d: any) => d.count) || [1]), 1))

onMounted(async () => {
  const res = await request.get('/admin/dashboard/detail')
  data.value = res as any
})

function formatDay(d: string) {
  return d ? d.slice(5) : ''
}
</script>

<style scoped>
.data-dashboard { padding: 20px; }
h2 { margin: 0 0 20px; font-size: 20px; }
h3 { font-size: 15px; margin: 0 0 12px; color: #333; }
.stat-cards { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 20px; }
.card { background: #fff; border-radius: 10px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.card .label { font-size: 13px; color: #999; }
.card .value { font-size: 28px; font-weight: 700; color: #1677ff; margin: 8px 0; }
.card .sub { font-size: 12px; color: #999; }
.chart-section { background: #fff; border-radius: 10px; padding: 20px; margin-bottom: 16px; box-shadow: 0 1px 4px rgba(0,0,0,0.06); }
.chart { display: flex; align-items: flex-end; gap: 12px; height: 200px; padding-top: 20px; }
.bar-item { flex: 1; display: flex; flex-direction: column; align-items: center; height: 100%; justify-content: flex-end; }
.bar { width: 60%; background: linear-gradient(180deg, #69b1ff, #1677ff); border-radius: 4px 4px 0 0; min-height: 4px; }
.bar-label { font-size: 11px; color: #999; margin-top: 6px; }
.bar-value { font-size: 11px; color: #666; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.dist-item { display: flex; align-items: center; gap: 10px; margin-bottom: 10px; }
.dist-name { width: 80px; font-size: 13px; }
.dist-bar { flex: 1; height: 16px; background: #f0f0f0; border-radius: 8px; overflow: hidden; }
.dist-bar div { height: 100%; background: #52c41a; border-radius: 8px; }
.dist-count { width: 40px; text-align: right; font-size: 13px; }
.rank-item { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f5f5f5; }
.rank-item:last-child { border-bottom: none; }
.rank { width: 24px; height: 24px; background: #f0f0f0; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; }
.name { flex: 1; font-size: 13px; }
.income { font-size: 13px; color: #52c41a; font-weight: 600; }
.withdraw-stats { display: flex; gap: 40px; }
.withdraw-stats div { font-size: 14px; color: #666; }
.withdraw-stats strong { color: #1677ff; font-size: 18px; margin-left: 6px; }
</style>
