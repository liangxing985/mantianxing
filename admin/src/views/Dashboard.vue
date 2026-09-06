<template>
  <div>
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <div class="stat-card">
          <div class="label">{{ stat.label }}</div>
          <div class="value" :style="{ color: stat.color }">{{ stat.value }}</div>
          <div class="sub">{{ stat.sub }}</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="12">
        <div class="chart-card">
          <h3>待处理事项</h3>
          <div class="todo-list">
            <div class="todo-item" @click="$router.push('/order-review')">
              <span class="todo-title">待审核报单</span>
              <el-tag type="warning">{{ data.pendingReviews }} 单</el-tag>
            </div>
            <div class="todo-item" @click="$router.push('/withdraw')">
              <span class="todo-title">待审核提现</span>
              <el-tag type="danger">{{ data.pendingWithdraws }} 笔</el-tag>
            </div>
            <div class="todo-item" @click="$router.push('/provider-apply')">
              <span class="todo-title">待审核陪玩入驻</span>
              <el-tag type="primary">查看</el-tag>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="chart-card">
          <h3>平台数据</h3>
          <div ref="chartRef" style="height: 280px;"></div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { getDashboard } from '@/api'
import * as echarts from 'echarts'

const data = ref({
  totalUsers: 0,
  totalProviders: 0,
  totalOrders: 0,
  todayOrders: 0,
  totalRevenue: 0,
  pendingReviews: 0,
  pendingWithdraws: 0,
})

const chartRef = ref()

const stats = computed(() => [
  { label: '注册用户', value: data.value.totalUsers, sub: '老板总数', color: '#409eff' },
  { label: '陪玩数量', value: data.value.totalProviders, sub: '入驻陪玩', color: '#67c23a' },
  { label: '订单总数', value: data.value.totalOrders, sub: `今日 ${data.value.todayOrders} 单`, color: '#e6a23c' },
  { label: '平台流水', value: (data.value.totalRevenue / 10).toFixed(0) + '元', sub: '累计消费星石', color: '#f56c6c' },
])

import { computed } from 'vue'

const loadData = async () => {
  data.value = await getDashboard() as any
  await nextTick()
  initChart()
}

const initChart = () => {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: {
      type: 'category',
      data: ['用户', '陪玩', '订单', '流水(元)'],
    },
    yAxis: { type: 'value' },
    series: [{
      type: 'bar',
      data: [
        data.value.totalUsers,
        data.value.totalProviders,
        data.value.totalOrders,
        Math.round(data.value.totalRevenue / 10),
      ],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#83bff6' },
          { offset: 1, color: '#188df0' },
        ]),
        borderRadius: [4, 4, 0, 0],
      },
      barWidth: 40,
    }],
  })
}

onMounted(loadData)
</script>

<style scoped>
.stat-card {
  padding: 24px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.stat-card .label {
  font-size: 14px;
  color: #909399;
}
.stat-card .value {
  font-size: 32px;
  font-weight: 600;
  margin: 8px 0 4px;
}
.stat-card .sub {
  font-size: 12px;
  color: #c0c4cc;
}
.chart-card {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.chart-card h3 {
  font-size: 16px;
  margin-bottom: 16px;
  color: #303133;
}
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.todo-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: #f5f7fa;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.todo-item:hover {
  background: #ecf5ff;
}
.todo-title {
  font-size: 14px;
  color: #606266;
}
</style>
