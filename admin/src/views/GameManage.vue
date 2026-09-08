<template>
  <div>
    <div class="page-header">
      <span class="page-title">游戏与服务项目管理</span>
      <el-button type="primary" @click="openGameDialog()">新增游戏</el-button>
    </div>

    <el-collapse v-model="activeGames">
      <el-collapse-item v-for="game in games" :key="game.id" :name="game.id">
        <template #title>
          <div class="game-title">
            <span>{{ game.name }}</span>
            <el-tag v-if="game.category" size="small" type="info">{{ game.category }}</el-tag>
            <el-tag size="small">{{ game.serviceItems?.length || 0 }} 个服务</el-tag>
            <el-button size="small" @click.stop="openGameDialog(game)">编辑</el-button>
            <el-button size="small" type="danger" @click.stop="deleteGame(game)">删除</el-button>
          </div>
        </template>

        <el-table :data="game.serviceItems" border size="small">
          <el-table-column prop="name" label="服务名称" />
          <el-table-column prop="defaultPrice" label="参考价(星石)" width="120" />
          <el-table-column prop="unit" label="计价单位" width="100">
            <template #default="{ row }">{{ unitLabel(row.unit) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag :type="row.isEnabled ? 'success' : 'info'" size="small">{{ row.isEnabled ? '启用' : '禁用' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button size="small" @click="openServiceDialog(game.id, row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteService(game, row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div style="margin-top: 12px;">
          <el-button size="small" type="primary" @click="openServiceDialog(game.id)">新增服务项目</el-button>
        </div>
      </el-collapse-item>
    </el-collapse>

    <!-- 游戏编辑弹窗 -->
    <el-dialog v-model="gameDialog" :title="gameForm.id ? '编辑游戏' : '新增游戏'" width="400px">
      <el-form :model="gameForm" label-width="80px">
        <el-form-item label="游戏名称" required>
          <el-input v-model="gameForm.name" />
        </el-form-item>
        <el-form-item label="游戏分类">
          <el-select v-model="gameForm.category" placeholder="选择分类" clearable style="width:100%;">
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="gameForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="gameForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="gameDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGame">保存</el-button>
      </template>
    </el-dialog>

    <!-- 服务项目编辑弹窗 -->
    <el-dialog v-model="serviceDialog" :title="serviceForm.id ? '编辑服务' : '新增服务'" width="400px">
      <el-form :model="serviceForm" label-width="90px">
        <el-form-item label="服务名称" required>
          <el-input v-model="serviceForm.name" />
        </el-form-item>
        <el-form-item label="参考价">
          <el-input-number v-model="serviceForm.defaultPrice" :min="0" />
          <span style="margin-left: 8px; color: #909399; font-size: 12px;">星石</span>
        </el-form-item>
        <el-form-item label="计价单位">
          <el-select v-model="serviceForm.unit" style="width: 100%;">
            <el-option v-for="u in unitOptions" :key="u.value" :label="u.label" :value="u.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="serviceForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="serviceForm.sortOrder" :min="0" />
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="serviceForm.isEnabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="serviceDialog = false">取消</el-button>
        <el-button type="primary" @click="saveService">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getGameList, createGame, updateGame, deleteGame as apiDeleteGame, createServiceItem, updateServiceItem, deleteServiceItem as apiDeleteServiceItem, getSystemConfig } from '@/api'

const games = ref<any[]>([])
const activeGames = ref<number[]>([])
const gameDialog = ref(false)
const serviceDialog = ref(false)
const unitOptions = ref<{label: string, value: string}[]>([
  { label: '按小时', value: 'hour' },
  { label: '按局', value: 'game' },
  { label: '包段', value: 'package' },
])
const categoryOptions = ref<string[]>([])

const gameForm = reactive({ id: null as number | null, name: '', category: '', sortOrder: 0, isEnabled: true })
const serviceForm = reactive({ id: null as number | null, gameId: 0, name: '', defaultPrice: 30, unit: 'hour', description: '', sortOrder: 0, isEnabled: true })

const unitLabel = (val: string) => unitOptions.value.find(u => u.value === val)?.label || val

const loadData = async () => {
  games.value = await getGameList() as any
  if (games.value.length > 0) activeGames.value = [games.value[0].id]
  // 加载系统配置中的计价单位和分类
  try {
    const res: any = await getSystemConfig()
    const data = res.data || res
    if (data.unit_options) {
      try {
        const arr = JSON.parse(data.unit_options)
        if (Array.isArray(arr) && arr.length > 0) unitOptions.value = arr
      } catch {}
    }
    if (data.game_categories) {
      try {
        const arr = JSON.parse(data.game_categories)
        if (Array.isArray(arr) && arr.length > 0) categoryOptions.value = arr
      } catch {}
    }
  } catch (e) {}
}

const openGameDialog = (game?: any) => {
  if (game) {
    gameForm.id = game.id
    gameForm.name = game.name
    gameForm.category = game.category || ''
    gameForm.sortOrder = game.sortOrder
    gameForm.isEnabled = game.isEnabled
  } else {
    gameForm.id = null
    gameForm.name = ''
    gameForm.category = ''
    gameForm.sortOrder = 0
    gameForm.isEnabled = true
  }
  gameDialog.value = true
}

const saveGame = async () => {
  if (!gameForm.name) { ElMessage.warning('请输入游戏名称'); return }
  if (gameForm.id) {
    await updateGame(gameForm.id, gameForm)
  } else {
    await createGame(gameForm)
  }
  ElMessage.success('保存成功')
  gameDialog.value = false
  loadData()
}

const deleteGame = async (game: any) => {
  await ElMessageBox.confirm(`确定删除游戏「${game.name}」吗？相关服务项目也会被删除`, '提示', { type: 'warning' })
  await apiDeleteGame(game.id)
  ElMessage.success('删除成功')
  loadData()
}

const openServiceDialog = (gameId: number, service?: any) => {
  serviceForm.gameId = gameId
  if (service) {
    serviceForm.id = service.id
    serviceForm.name = service.name
    serviceForm.defaultPrice = service.defaultPrice
    serviceForm.unit = service.unit
    serviceForm.description = service.description
    serviceForm.sortOrder = service.sortOrder
    serviceForm.isEnabled = service.isEnabled
  } else {
    serviceForm.id = null
    serviceForm.name = ''
    serviceForm.defaultPrice = 30
    serviceForm.unit = unitOptions.value[0]?.value || 'hour'
    serviceForm.description = ''
    serviceForm.sortOrder = 0
    serviceForm.isEnabled = true
  }
  serviceDialog.value = true
}

const saveService = async () => {
  if (!serviceForm.name) { ElMessage.warning('请输入服务名称'); return }
  if (serviceForm.id) {
    await updateServiceItem(serviceForm.id, serviceForm)
  } else {
    await createServiceItem(serviceForm)
  }
  ElMessage.success('保存成功')
  serviceDialog.value = false
  loadData()
}

const deleteService = async (game: any, service: any) => {
  await ElMessageBox.confirm(`确定删除服务「${service.name}」吗？`, '提示', { type: 'warning' })
  await apiDeleteServiceItem(service.id)
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.game-title {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
