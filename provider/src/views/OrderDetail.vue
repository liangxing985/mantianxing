<template>
  <div v-if="order" class="order-detail">
    <van-nav-bar title="订单详情" left-arrow @click-left="$router.back()" />
    <div class="status-card" :class="order.status">
      <div class="status-text">{{ statusText(order.status) }}</div>
      <div class="status-desc">{{ statusDesc(order.status) }}</div>
    </div>

    <div class="card">
      <div class="card-title">老板信息</div>
      <van-cell title="昵称" :value="order.customer?.nickname" />
      <van-cell title="联系方式" :value="`${order.contactType}: ${order.contactValue}`" />
      <van-cell title="订单要求" :value="order.requirement || '无'" />
    </div>

    <div class="card">
      <div class="card-title">订单信息</div>
      <van-cell title="服务" :value="`${order.serviceItem?.game?.name} / ${order.serviceItem?.name}`" />
      <van-cell title="数量" :value="`${order.duration} ${unitText(order.unit)}`" />
      <van-cell title="单价" :value="`${order.unitPrice} 星石`" />
      <van-cell title="预计收入">
        <template #value><span style="color: #00b894; font-weight: 600;">{{ Math.round(order.totalAmount * 0.8) }} 星石</span></template>
      </van-cell>
      <van-cell title="平台抽成" :value="`${order.platformFee || Math.round(order.totalAmount * 0.2)} 星石 (20%)`" />
    </div>

    <!-- 报单凭证 -->
    <div class="card" v-if="order.evidences?.length > 0">
      <div class="card-title">报单凭证</div>
      <div class="evidence-grid">
        <van-image v-for="(ev, i) in order.evidences" :key="i" :src="ev.imageUrl" width="80" height="80" fit="cover" radius="6" />
      </div>
      <div v-if="order.reportComment" style="margin-top: 8px; font-size: 13px; color: #666;">{{ order.reportComment }}</div>
    </div>

    <!-- 底部操作 -->
    <div class="bottom-bar" v-if="order.status === 'ASSIGNED'">
      <van-button block type="primary" @click="handleStart">开始服务</van-button>
    </div>
    <div class="bottom-bar" v-else-if="order.status === 'SERVING'">
      <van-button block type="warning" @click="showReport = true">提交报单</van-button>
    </div>

    <!-- 报单弹窗 -->
    <van-popup v-model:show="showReport" position="bottom" round :style="{ height: '70%' }">
      <div class="report-form">
        <h3>提交报单</h3>
        <p class="tip">请上传服务完成截图（如战绩、时长等），运营审核通过后结算</p>
        <van-uploader :file-list="fileList" :max-count="6" multiple @after-read="onAfterRead" @delete="onDelete" />
        <van-field v-model="reportForm.comment" type="textarea" label="备注" placeholder="服务说明（选填）" rows="2" />
        <van-button type="primary" block round style="margin-top: 16px;" @click="submitReportForm">提交审核</van-button>
      </div>
    </van-popup>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { getOrderDetail, startOrder, submitReport } from '@/api'
const route = useRoute()
const order = ref<any>(null)
const showReport = ref(false)
const reportForm = reactive({ images: [] as any[], comment: '' })
const fileList = ref<any[]>([])

// 上传后手动收集图片数据（不依赖 v-model，更稳定）
const onAfterRead = (item: any) => {
  const data = item.content || (item.file ? URL.createObjectURL(item.file) : '')
  if (data && reportForm.images.indexOf(data) === -1) {
    reportForm.images.push(data)
    fileList.value.push({ url: data })
  }
}
const onDelete = (item: any) => {
  const idx = fileList.value.indexOf(item)
  if (idx > -1) {
    fileList.value.splice(idx, 1)
    reportForm.images.splice(idx, 1)
  }
}

const loadData = async () => { order.value = await getOrderDetail(Number(route.params.id)) }

const handleStart = async () => {
  await startOrder(order.value.id)
  showSuccessToast('已开始服务')
  loadData()
}

const submitReportForm = async () => {
  if (reportForm.images.length === 0) { showToast('请至少上传一张截图'); return }
  await submitReport(order.value.id, { images: reportForm.images, comment: reportForm.comment })
  showSuccessToast('报单已提交，等待审核')
  showReport.value = false
  loadData()
}

const statusText = (s: string) => ({ ASSIGNED: '待开始服务', SERVING: '服务进行中', REVIEWING: '等待运营审核', COMPLETED: '订单已完成', CANCELLED: '订单已取消' }[s] || s)
const statusDesc = (s: string) => ({ ASSIGNED: '请尽快联系老板并开始服务', SERVING: '服务完成后请提交报单', REVIEWING: '报单审核中，通过后自动结算', COMPLETED: '收入已到账，继续加油！' }[s] || '')
const unitText = (u: string) => ({ hour: '小时', game: '局', package: '段' }[u] || '')
onMounted(loadData)
</script>
<style scoped>
.order-detail { padding-bottom: 70px; }
.status-card { background: linear-gradient(135deg, #00b894, #55efc4); color: #fff; padding: 24px 16px; text-align: center; }
.status-card.CANCELLED { background: linear-gradient(135deg, #999, #bbb); }
.status-card.COMPLETED { background: linear-gradient(135deg, #52c41a, #95de64); }
.status-text { font-size: 20px; font-weight: 600; }
.status-desc { font-size: 13px; opacity: 0.9; margin-top: 4px; }
.card { background: #fff; margin: 12px; border-radius: 12px; overflow: hidden; }
.card-title { padding: 14px 16px 0; font-size: 15px; font-weight: 600; }
.evidence-grid { display: flex; flex-wrap: wrap; gap: 8px; padding: 14px 16px; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 10px 16px; background: #fff; }
.report-form { padding: 20px; }
.report-form h3 { font-size: 18px; margin-bottom: 8px; }
.tip { font-size: 13px; color: #999; margin-bottom: 16px; }
</style>
