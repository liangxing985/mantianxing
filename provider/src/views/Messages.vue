<template>
  <div>
    <van-nav-bar title="消息通知" left-arrow @click-left="$router.back()" />
    <van-list v-model:loading="loading" :finished="finished" finished-text="没有更多了" @load="loadData">
      <div v-for="msg in list" :key="msg.id" class="msg-item">
        <div class="msg-type">{{ typeText(msg.type) }}</div>
        <div class="msg-content">{{ msg.content }}</div>
        <div class="msg-time">{{ formatTime(msg.createdAt) }}</div>
      </div>
      <div v-if="list.length === 0 && !loading" class="empty">暂无消息</div>
    </van-list>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getMessages } from '@/api'
import dayjs from 'dayjs'
const list = ref<any[]>([]); const loading = ref(false); const finished = ref(false); const page = ref(1)
const loadData = async () => {
  loading.value = true
  try {
    const res: any = await getMessages({ page: page.value, pageSize: 20 })
    list.value = page.value === 1 ? res.list : [...list.value, ...res.list]
    finished.value = list.value.length >= res.total; page.value++
  } finally { loading.value = false }
}
const typeText = (t: string) => ({ SYSTEM: '系统通知', ORDER: '订单通知', WALLET: '钱包通知' }[t] || '通知')
const formatTime = (t: string) => dayjs(t).format('MM-DD HH:mm')
onMounted(loadData)
</script>
<style scoped>
.msg-item { background: #fff; margin: 10px 12px; border-radius: 12px; padding: 14px; }
.msg-type { font-size: 13px; font-weight: 600; color: #00b894; }
.msg-content { font-size: 14px; color: #333; margin: 6px 0; }
.msg-time { font-size: 12px; color: #999; }
.empty { text-align: center; color: #999; padding: 40px; }
</style>
