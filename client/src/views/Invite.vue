<template>
  <div class="invite-page">
    <div class="header">
      <div class="title">邀请好友</div>
      <div class="subtitle">邀请好友注册，好友消费享10%佣金</div>
    </div>
    <div class="code-card">
      <div class="label">我的邀请码</div>
      <div class="code">{{ inviteCode || '生成中...' }}</div>
      <button class="copy-btn" @click="copyCode">复制邀请码</button>
    </div>
    <div class="stats">
      <div class="stat-item">
        <div class="num">{{ inviteData.totalInvited || 0 }}</div>
        <div class="label">已邀请</div>
      </div>
      <div class="stat-item">
        <div class="num">{{ inviteData.totalReward || 0 }}</div>
        <div class="label">累计佣金(星石)</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">邀请记录</div>
      <div v-if="inviteData.records?.length === 0" class="empty">暂无邀请记录</div>
      <div v-for="r in inviteData.records" :key="r.id" class="record">
        <img :src="r.invitee.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <div class="name">{{ r.invitee.nickname }}</div>
          <div class="time">{{ formatDate(r.createdAt) }} 注册</div>
        </div>
        <div class="reward" v-if="r.rewardAmount > 0">+{{ r.rewardAmount }}星石</div>
      </div>
    </div>
    <div class="section">
      <div class="section-title">佣金记录</div>
      <div v-if="commissions.records?.length === 0" class="empty">暂无佣金记录</div>
      <div v-for="c in commissions.records" :key="c.id" class="record">
        <div class="info">
          <div class="name">邀请佣金</div>
          <div class="time">{{ formatDate(c.createdAt) }}</div>
        </div>
        <div class="reward">+{{ c.amount }}星石</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import request from '@/utils/request'
import { showToast } from 'vant'

const inviteCode = ref('')
const inviteData = ref<any>({ records: [] })
const commissions = ref<any>({ records: [] })
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23ddd"/></svg>'

onMounted(async () => {
  const [codeRes, inviteRes, commRes]: any[] = await Promise.all([
    request.get('/invite/code'),
    request.get('/invite/list'),
    request.get('/invite/commissions'),
  ])
  inviteCode.value = codeRes?.data?.inviteCode || codeRes?.inviteCode || ''
  inviteData.value = inviteRes?.data || inviteRes
  commissions.value = commRes?.data || commRes
})

function copyCode() {
  navigator.clipboard.writeText(inviteCode.value)
  showToast('已复制')
}

function formatDate(d: any) {
  return new Date(d).toLocaleDateString()
}
</script>

<style scoped>
.invite-page { min-height: 100vh; background: #f5f5f5; padding-bottom: 20px; }
.header { background: linear-gradient(135deg, #667eea, #764ba2); padding: 40px 20px; text-align: center; color: #fff; }
.title { font-size: 22px; font-weight: 700; }
.subtitle { font-size: 13px; opacity: 0.85; margin-top: 6px; }
.code-card { background: #fff; margin: -20px 16px 16px; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
.code-card .label { font-size: 13px; color: #999; }
.code { font-size: 32px; font-weight: 700; color: #667eea; letter-spacing: 4px; margin: 12px 0; }
.copy-btn { padding: 8px 24px; background: #667eea; color: #fff; border: none; border-radius: 20px; font-size: 14px; cursor: pointer; }
.stats { display: flex; background: #fff; margin: 0 16px 16px; border-radius: 12px; padding: 20px 0; }
.stat-item { flex: 1; text-align: center; }
.stat-item .num { font-size: 24px; font-weight: 700; color: #333; }
.stat-item .label { font-size: 12px; color: #999; margin-top: 4px; }
.section { background: #fff; margin: 0 16px 16px; border-radius: 12px; padding: 16px; }
.section-title { font-size: 15px; font-weight: 600; margin-bottom: 12px; }
.record { display: flex; align-items: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.record:last-child { border-bottom: none; }
.avatar { width: 40px; height: 40px; border-radius: 50%; margin-right: 10px; }
.info { flex: 1; }
.name { font-size: 14px; }
.time { font-size: 11px; color: #999; margin-top: 2px; }
.reward { color: #52c41a; font-size: 14px; font-weight: 600; }
.empty { text-align: center; color: #ccc; padding: 20px 0; font-size: 13px; }
</style>
