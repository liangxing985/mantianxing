<template>
  <div class="tab-layout">
    <div class="content">
      <router-view />
    </div>
    <van-tabbar v-model="active" route>
      <van-tabbar-item to="/home" icon="home-o">首页</van-tabbar-item>
      <van-tabbar-item to="/orders" icon="orders-o">订单</van-tabbar-item>
      <van-tabbar-item to="/wallet" icon="balance-o">钱包</van-tabbar-item>
      <van-tabbar-item to="/profile" icon="user-o">我的</van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const active = ref(0)
</script>

<style scoped>
.tab-layout {
  min-height: 100vh;
  padding-bottom: 50px;
}
.content {
  min-height: calc(100vh - 50px);
}
</style>
