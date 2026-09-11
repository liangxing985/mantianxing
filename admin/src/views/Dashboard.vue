<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <div class="stat-card" :class="stat.className">
          <div class="stat-icon">{{ stat.icon }}</div>
          <div class="stat-content">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
            <div class="stat-sub">{{ stat.sub }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 待处理 + 图表 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="10">
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">待处理事项</h3>
            <span class="panel-badge">{{ totalPending }} 项</span>
          </div>
          <div class="todo-list">
            <div class="todo-item" @click="$router.push('/order-review')">
              <div class="todo-icon warning">📋</div>
              <div class="todo-info">
                <div class="todo-title">待审核报单</div>
                <div class="todo-desc">需要审核的陪玩报单</div>
              </div>
              <el-tag type="warning" effect="dark">{{ data.pendingReviews }} 单</el-tag>
            </div>
            <div class="todo-item" @click="$router.push('/withdraw')">
              <div class="todo-icon danger">💰</div>
              <div class="todo-info">
                <div class="todo-title">待审核提现</div>
                <div class="todo-desc">用户提现申请待处理</div>
              </div>
              <el-tag type="danger" effect="dark">{{ data.pendingWithdraws }} 笔</el-tag>
            </div>
            <div class="todo-item" @click="$router.push('/provider-apply')">
              <div class="todo-icon primary">👤</div>
              <div class="todo-info">
                <div class="todo-title">陪玩入驻审核</div>
                <div class="todo-desc">新陪玩申请待审核</div>
              </div>
              <el-tag type="primary" effect="dark">查看</el-tag>
            </div>
          </div>
        </div>
      </el-col>
      <el-col :span="14">
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">平台数据概览</h3>
          </div>
          <div ref="chartRef" style="height: 320px;"></div>
        </div>
      </el-col>
    </el-row>

    <!-- 快捷入口 -->
    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="24">
        <div class="panel-card">
          <div class="panel-header">
            <h3 class="panel-title">快捷操作</h3>
          </div>
          <div class="quick-actions">
            <div class="quick-item" @click="$router.push('/orders')">
              <div class="quick-icon">📦</div>
              <span>订单管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/providers')">
              <div class="quick-icon">🎮</div>
              <span>陪玩管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/products')">
              <div class="quick-icon">🛒</div>
              <span>商品管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/users')">
              <div class="quick-icon">👥</div>
              <span>用户管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/games')">
              <div class="quick-icon">🕹️</div>
              <span>游戏管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/pricing')">
              <div class="quick-icon">💎</div>
              <span>定价管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/activities')">
              <div class="quick-icon">🎉</div>
              <span>活动管理</span>
            </div>
            <div class="quick-item" @click="$router.push('/settings')">
              <div class="quick-icon">⚙️</div>
              <span>系统设置</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { getDashboard } from '@/api'
import * as echarts from 'echarts'

const data = ref({
  totalUsers: 0,
  totalProviders: 0,
  totalOrders: 0,
  todayOrders: 0,
  totalRevenue: 0,
  platformRevenue: 0,
  platformBalance: 0,
  pendingReviews: 0,
  pendingWithdraws: 0,
})

const chartRef = ref()

const totalPending = computed(() => 
  (data.value.pendingReviews || 0) + (data.value.pendingWithdraws || 0)
)

const stats = computed(() => [
  { 
    label: '注册用户', 
    value: data.value.totalUsers, 
    sub: '老板总数', 
    icon: '👥',
    className: 'stat-blue'
  },
  { 
    label: '陪玩数量', 
    value: data.value.totalProviders, 
    sub: '入驻陪玩', 
    icon: '🎮',
    className: 'stat-green'
  },
  { 
    label: '订单总数', 
    value: data.value.totalOrders, 
    sub: `今日 ${data.value.todayOrders} 单`, 
    icon: '📦',
    className: 'stat-orange'
  },
  { 
    label: '平台收入', 
    value: data.value.platformBalance + ' 星石', 
    sub: `累计抽成 ${data.value.platformRevenue} 星石`, 
    icon: '💰',
    className: 'stat-red'
  },
])

const loadData = async () => {
  data.value = await getDashboard() as any
  await nextTick()
  initChart()
}

const initChart = () => {
  if (!chartRef.value) return
  const chart = echarts.init(chartRef.value)
  chart.setOption({
    tooltip: { 
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.95)',
      borderColor: '#eef0f4',
      textStyle: { color: '#303133' }
    },
    grid: { left: 50, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'category',
      data: ['注册用户', '陪玩数量', '订单总数', '平台流水(元)'],
      axisLine: { lineStyle: { color: '#eef0f4' } },
      axisLabel: { color: '#909399', fontSize: 12 },
    },
    yAxis: { 
      type: 'value',
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: '#f5f7fa' } },
      axisLabel: { color: '#909399', fontSize: 12 },
    },
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
          { offset: 0, color: '#a29bfe' },
          { offset: 1, color: '#6c5ce7' },
        ]),
        borderRadius: [6, 6, 0, 0],
      },
      barWidth: 50,
      label: {
        show: true,
        position: 'top',
        color: '#606266',
        fontSize: 12,
        fontWeight: 600,
      }
    }],
  })
  window.addEventListener('resize', () => chart.resize())
}

onMounted(loadData)
</script>

<style scoped>
.dashboard { padding: 0; }

/* 统计卡片 */
.stat-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border: 1px solid #eef0f4;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
}

.stat-blue .stat-icon { background: #ecf5ff; }
.stat-green .stat-icon { background: #f0f9eb; }
.stat-orange .stat-icon { background: #fdf6ec; }
.stat-red .stat-icon { background: #fef0f0; }

.stat-content { flex: 1; min-width: 0; }

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
}

.stat-sub {
  font-size: 12px;
  color: #c0c4cc;
  margin-top: 4px;
}

/* 面板卡片 */
.panel-card {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
  border: 1px solid #eef0f4;
  height: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.panel-badge {
  background: #fdf6ec;
  color: #e6a23c;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

/* 待办列表 */
.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  background: #fafbfc;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.todo-item:hover {
  background: #f5f7fa;
  border-color: #e4e7ed;
}

.todo-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}

.todo-icon.warning { background: #fdf6ec; }
.todo-icon.danger { background: #fef0f0; }
.todo-icon.primary { background: #ecf5ff; }

.todo-info { flex: 1; }

.todo-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.todo-desc {
  font-size: 12px;
  color: #909399;
}

/* 快捷操作 */
.quick-actions {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: #606266;
}

.quick-item:hover {
  background: #f5f3ff;
  color: #6c5ce7;
}

.quick-icon {
  font-size: 28px;
}
</style>
