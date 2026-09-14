<template>
  <div class="chat-page">
    <div v-if="!currentConv" class="conv-list">
      <div class="header">消息</div>
      <div v-if="conversations.length === 0" class="empty">暂无会话，去陪玩大厅发起聊天吧</div>
      <div v-for="c in conversations" :key="c.id" class="conv-item" @click="openConv(c)">
        <img :src="c.target?.avatar || defaultAvatar" class="avatar" />
        <div class="info">
          <div class="name">{{ c.target?.nickname || '用户' }}</div>
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
        <div v-if="messages.length === 0" class="empty-msg">暂无消息，发送第一条消息吧</div>
        <div v-for="m in messages" :key="m.id" :class="['msg', m.senderId === userId ? 'me' : 'other']">
          <img v-if="m.senderId !== userId" :src="m.sender?.avatar || defaultAvatar" class="avatar" />
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
import { useRouter, useRoute } from 'vue-router'
import request from '@/utils/request'

const router = useRouter()
const route = useRoute()
const userId = Number(localStorage.getItem('provider_user_id') || 0)
const defaultAvatar = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><circle cx="20" cy="20" r="20" fill="%23ddd"/><text x="20" y="25" text-anchor="middle" font-size="16" fill="%23999">?</text></svg>'

const conversations = ref<any[]>([])
const currentConv = ref<any>(null)
const messages = ref<any[]>([])
const input = ref('')
const msgBox = ref<HTMLElement>()

onMounted(async () => {
  await loadConversations()
  // 从URL参数自动打开会话
  const convId = route.query.conversationId
  if (convId) {
    const conv = conversations.value.find(c => c.id === Number(convId))
    if (conv) {
      await openConv(conv)
    } else {
      // 如果会话列表里没有，直接通过ID加载消息
      currentConv.value = { id: Number(convId), target: {} }
      await loadMessages(Number(convId))
    }
  }
})

async function loadConversations() {
  try {
    const res: any = await request.get('/chat/conversations')
    conversations.value = res?.data || res || []
  } catch (e) {
    console.error('加载会话失败', e)
  }
}

async function openConv(c: any) {
  currentConv.value = c
  await loadMessages(c.id)
}

async function loadMessages(convId: number) {
  try {
    const res: any = await request.get(`/chat/messages/${convId}`)
    messages.value = res?.data || res || []
  } catch (e) {
    messages.value = []
  }
  await nextTick()
  msgBox.value?.scrollTo({ top: msgBox.value.scrollHeight })
}

async function send() {
  if (!input.value.trim() || !currentConv.value) return
  try {
    const res: any = await request.post(`/chat/messages/${currentConv.value.id}`, { content: input.value })
    messages.value.push(res?.data || res)
    input.value = ''
    await nextTick()
    msgBox.value?.scrollTo({ top: msgBox.value.scrollHeight })
  } catch (e: any) {
    console.error('发送失败', e)
  }
}
</script>

<style scoped>
.chat-page {
  height: calc(100vh - 64px);
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
  overflow: hidden;
}
.header { padding: 16px; font-size: 18px; font-weight: 600; background: #fff; border-bottom: 1px solid #eee; }
.empty { text-align: center; color: #999; padding: 60px 0; }
.conv-list { flex: 1; overflow-y: auto; }
.conv-item { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #f0f0f0; cursor: pointer; }
.conv-item:hover { background: #f9f9f9; }
.conv-item .avatar { width: 48px; height: 48px; border-radius: 50%; margin-right: 12px; }
.conv-item .info { flex: 1; min-width: 0; }
.conv-item .name { font-size: 15px; font-weight: 500; }
.conv-item .last { font-size: 12px; color: #999; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge { background: #ff4d4f; color: #fff; border-radius: 10px; padding: 2px 8px; font-size: 12px; }
.chat-room { display: flex; flex-direction: column; flex: 1; min-height: 0; }
.chat-header { display: flex; align-items: center; padding: 14px 16px; background: #fff; border-bottom: 1px solid #eee; flex-shrink: 0; }
.chat-header .back { margin-right: 12px; cursor: pointer; font-size: 18px; }
.chat-header .name { font-size: 16px; font-weight: 600; }
.messages { flex: 1; overflow-y: auto; padding: 16px; min-height: 0; }
.empty-msg { text-align: center; color: #bbb; padding: 40px 0; font-size: 13px; }
.msg { display: flex; margin-bottom: 16px; align-items: flex-end; }
.msg.me { justify-content: flex-end; }
.msg .avatar { width: 36px; height: 36px; border-radius: 50%; margin-right: 8px; flex-shrink: 0; }
.msg.me .avatar { display: none; }
.bubble { max-width: 70%; padding: 10px 14px; border-radius: 12px; font-size: 14px; line-height: 1.5; word-break: break-all; }
.msg.other .bubble { background: #fff; }
.msg.me .bubble { background: #1677ff; color: #fff; }
.input-bar { display: flex; padding: 12px 16px; background: #fff; border-top: 1px solid #eee; gap: 8px; flex-shrink: 0; }
.input-bar input { flex: 1; padding: 10px 14px; border: 1px solid #ddd; border-radius: 20px; font-size: 14px; outline: none; }
.input-bar input:focus { border-color: #1677ff; }
.input-bar button { padding: 10px 20px; background: #1677ff; color: #fff; border: none; border-radius: 20px; cursor: pointer; }
.input-bar button:hover { background: #4096ff; }
</style>
