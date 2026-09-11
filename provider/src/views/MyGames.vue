<template>
  <div class="my-games">
    <van-nav-bar title="可接游戏设置" left-arrow @click-left="$router.back()" />
    <div class="tip">勾选你可以接单的游戏项目，保存后生效</div>
    <van-cell-group inset>
      <van-cell
        v-for="game in gameList"
        :key="game.id"
        :title="game.name"
        clickable
        @click="toggleGame(game.id)"
      >
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
const selectedIds = ref<number[]>([])
const saving = ref(false)

const loadData = async () => {
  try {
    const [gamesRes, myGamesRes]: any[] = await Promise.all([getGameList(), getMyGames()])
    gameList.value = gamesRes.data || gamesRes || []
    const myGames = myGamesRes.data || myGamesRes || []
    selectedIds.value = myGames.map((g: any) => g.id)
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
    await setMyGames(selectedIds.value)
    showToast('保存成功')
    setTimeout(() => history.back(), 800)
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
.save-bar { position: fixed; bottom: 0; left: 0; right: 0; padding: 12px 16px; background: #fff; border-top: 1px solid #eee; }
</style>
