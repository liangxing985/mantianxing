<template>
  <div class="my-games">
    <van-nav-bar title="可接游戏设置" left-arrow @click-left="$router.back()" />
    <div class="tip">勾选你可以接单的游戏项目，新增游戏需管理员审核通过后生效</div>
    <van-cell-group inset>
      <van-cell
        v-for="game in gameList"
        :key="game.id"
        :title="game.name"
        clickable
        @click="toggleGame(game.id)"
      >
        <template #title>
          <div class="game-title">
            <span>{{ game.name }}</span>
            <van-tag v-if="getGameStatus(game.id) === 'PENDING'" type="warning">审核中</van-tag>
            <van-tag v-else-if="getGameStatus(game.id) === 'REJECTED'" type="danger">已驳回</van-tag>
            <van-tag v-else-if="getGameStatus(game.id) === 'APPROVED'" type="success">已开通</van-tag>
          </div>
        </template>
        <template #right-icon>
          <van-checkbox :checked="selectedIds.includes(game.id)" :name="game.id" />
        </template>
      </van-cell>
      <van-cell v-if="gameList.length === 0" title="暂无游戏项目" />
    </van-cell-group>
    <div class="save-bar">
      <van-button type="primary" block :loading="saving" @click="handleSave">保存设置</van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { getGameList, getMyGames, setMyGames } from '@/api'

const gameList = ref<any[]>([])
const myGames = ref<any[]>([])
const selectedIds = ref<number[]>([])
const saving = ref(false)

const getGameStatus = (gameId: number) => {
  const g = myGames.value.find((g: any) => g.id === gameId)
  return g?.status || null
}

const loadData = async () => {
  try {
    const [gamesRes, myGamesRes]: any[] = await Promise.all([getGameList(), getMyGames()])
    gameList.value = gamesRes.data || gamesRes || []
    myGames.value = myGamesRes.data || myGamesRes || []
    selectedIds.value = myGames.value.map((g: any) => g.id)
  } catch (e) {
    showToast('加载失败')
  }
}

const toggleGame = (id: number) => {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    const res: any = await setMyGames(selectedIds.value)
    if (res.pendingCount && res.pendingCount > 0) {
      showToast(`保存成功，${res.pendingCount}个游戏待审核`)
    } else {
      showToast('保存成功')
    }
    setTimeout(() => history.back(), 1000)
  } catch (e: any) {
    showToast(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.my-games { padding-bottom: 80px; }
.tip { padding: 12px 16px; font-size: 13px; color: #999; }
.game-title {
  display: flex;
  align-items: center;
  gap: 8px;
}
.save-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: #fff; border-top: 1px solid #eee; }
</style>
