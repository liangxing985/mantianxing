<template>
  <div class="chat-page">
    <div v-if="!currentConv" class="conv-list">
      <div class="header">消息</div>
      <div v-if="conversations.length === 0" class="empty">暂无会话</div>
      <div v-for="c in conversations" :key="c.id" class="conv-item" @click="openConv(c)">
        <img :src="c.target.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <div class="name">{{ c.target.nickname }}</div>
          <div class="last">{{ c.lastMessage || '开始聊天' }}</div>
        </div>
        <div v-if="c.unread > 0" class="badge">{{ c.unread }}</div>
      </div>
    </div>
    <div v-else class="chat-room">
      <div class="chat-header">
        <span class="back" @click="currentConv = null">←</span>
        <span class="name">{{ currentConv.target?.nickname || '聊天' }}</span>
      </div>
      <div class="messages" ref="msgBox">
        <div v-for="m in messages" :key="m.id" :class="['msg', m.senderId === userId ? 'me' : 'other']">
          <img v-if="m.senderId !== userId" :src="m.sender.avatar || defaultAvatar" class="avatar" />
          <div class="bubble">{{ m.content }}</div>
        </div>
      </div>
      <div class="input-bar">
        <input v-model="input" placeholder="输入消息..." @keyup.enter="send" />
        <button @click="send">发送</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const userId = Number(localStorage.getItem('client_user_id') || 0)
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23ddd"/><text x="20" y="25" text-anchor="middle" font-size="16" fill="%23999">?</text></svg>'

const conversations = ref<any[]>([])
const currentConv = ref<any>(null)
const messages = ref<any[]>([])
const input = ref('')
const msgBox = ref<HTMLElement>()

onMounted(() => {
  loadConversations()
})

async function loadConversations() {
  try {
    const res = await request.get('/chat/conversations')
    conversations.value = res.data || res
  } catch (e) {
    router.push('/login')
  }
}

async function openConv(c: any) {
  currentConv.value = c
  const res = await request.get(`/chat/messages/${c.id}`)
  messages.value = res.data || res
  await nextTick()
  msgBox.value?.scrollTo({ top: msgBox.value.scrollHeight })
}

async function send() {
  if (!input.value.trim() || !currentConv.value) return
  const res = await request.post(`/chat/messages/${currentConv.value.id}`, { content: input.value })
  messages.value.push(res.data || res)
  input.value = ''
  await nextTick()
  msgBox.value?.scrollTo({ top: msgBox.value.scrollHeight })
}
</script>

<style scoped>
.chat-page { height: 100vh; display: flex; flex-direction: column; background: #f5f5f5; }
.header { padding: 16px; font-size: 18px; font-weight: 600; background: #fff; border-bottom: 1px solid #eee; }
.empty { text-align: center; color: #999; padding: 60px 0; }
.conv-item { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.conv-item .avatar { width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; }
.conv-item .info { flex: 1; }
.conv-item .name { font-size: 15px; font-weight: 500; }
.conv-item .last { font-size: 12px; color: #999; margin-top: 4px; }
.badge { background: #ff4d4f; color: #fff; border-radius: 10px; padding: 2px 8px; font-size: 12px; }
.chat-room { display: flex; flex-direction: column; height: 100vh; }
.chat-header { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #eee; }
.chat-header .back { margin-right: 12px; cursor: pointer; font-size: 18px; }
.chat-header .name { font-size: 16px; font-weight: 600; }
.messages { flex: 1; overflow-y: auto; padding: 16px; }
.msg { display: flex; margin-bottom: 16px; align-items: flex-end; }
.msg.me { justify-content: flex-end; }
.msg .avatar { width: 36px; height: 36px; border-radius: 50%; margin-right: 8px; }
.msg.me .avatar { display: none; }
.bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; }
.msg.other .bubble { background: #fff; }
.msg.me .bubble { background: #1677ff; color: #fff; }
.input-bar { display: flex; padding: 12px 16px; background: #fff; border-top: 1px solid #eee; gap: 8px; }
.input-bar input { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none; }
.input-bar button { padding: 10px 20px; background: #1677ff; color: #fff; border: none; border-radius: 20px; cursor: pointer; }
</style>
