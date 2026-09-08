<template>
  <div>
    <div class="page-header">
      <span class="page-title">陪玩管理</span>
      <div>
        <el-input v-model="keyword" placeholder="搜索昵称" clearable style="width:180px;margin-right:12px;" @clear="loadList" @keyup.enter="loadList" />
        <el-select v-model="status" placeholder="全部状态" clearable style="width:120px;margin-right:12px;" @change="loadList">
          <el-option label="正常" value="ACTIVE" />
          <el-option label="已拉黑" value="DISABLED" />
          <el-option label="已冻结" value="FROZEN" />
        </el-select>
      </div>
    </div>

    <el-table :data="list" border v-loading="loading">
      <el-table-column prop="id" label="ID" width="60" />
      <el-table-column label="头像" width="70">
        <template #default="{ row }">
          <el-avatar :src="row.avatar" :size="36">{{ row.nickname?.charAt(0) }}</el-avatar>
        </template>
      </el-table-column>
      <el-table-column prop="nickname" label="昵称" width="120" />
      <el-table-column prop="username" label="账号" width="100" />
      <el-table-column label="段位" width="100">
        <template #default="{ row }">
          <el-tag v-if="row.providerProfile?.rank" type="warning" size="small">{{ row.providerProfile.rank }}</el-tag>
          <span v-else style="color:#ccc;">未设置</span>
        </template>
      </el-table-column>
      <el-table-column label="等级" width="70">
        <template #default="{ row }">Lv.{{ row.providerProfile?.level || 1 }}</template>
      </el-table-column>
      <el-table-column label="评分" width="80">
        <template #default="{ row }">{{ row.providerProfile?.rating?.toFixed(1) || '5.0' }}</template>
      </el-table-column>
      <el-table-column label="完成订单" width="90">
        <template #default="{ row }">{{ row.providerProfile?.orderCount || 0 }}</template>
      </el-table-column>
      <el-table-column label="累计收入" width="100">
        <template #default="{ row }">{{ row.providerProfile?.totalIncome || 0 }} 星石</template>
      </el-table-column>
      <el-table-column label="状态" width="80">
        <template #default="{ row }">
          <el-tag :type="row.status==='ACTIVE'?'success':'danger'" size="small">
            {{ row.status==='ACTIVE'?'正常':'已拉黑' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="340" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="openEdit(row)">编辑</el-button>
          <el-button size="small" type="primary" @click="openGames(row)">游戏</el-button>
          <el-button size="small" type="warning" @click="openRank(row)">段位</el-button>
          <el-button size="small" :type="row.status==='ACTIVE'?'danger':'success'" @click="toggleBan(row)">
            {{ row.status==='ACTIVE'?'拉黑':'解封' }}
          </el-button>
          <el-button size="small" type="danger" @click="remove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination style="margin-top:16px;justify-content:flex-end;display:flex;"
      v-model:current-page="page" v-model:page-size="pageSize" :total="total"
      layout="total, prev, pager, next" @current-change="loadList" />

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editDialog" title="编辑陪玩资料" width="450px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="陪玩等级">
          <el-input-number v-model="editForm.level" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="游戏段位">
          <el-select v-model="editForm.rank" placeholder="选择段位" style="width:100%;" allow-filter>
            <el-option v-for="r in rankOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEdit" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 段位快捷设置弹窗 -->
    <el-dialog v-model="rankDialog" title="设置陪玩段位" width="350px">
      <el-form label-width="80px">
        <el-form-item label="当前陪玩">
          <span style="font-weight:600;">{{ rankTarget?.nickname }}</span>
        </el-form-item>
        <el-form-item label="游戏段位">
          <el-select v-model="rankValue" placeholder="选择段位" style="width:100%;">
            <el-option v-for="r in rankOptions" :key="r" :label="r" :value="r" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rankDialog = false">取消</el-button>
        <el-button type="primary" @click="saveRank" :loading="saving">确定</el-button>
      </template>
    </el-dialog>

    <!-- 可接游戏设置弹窗 -->
    <el-dialog v-model="gamesDialog" title="设置可接游戏" width="450px">
      <div style="margin-bottom:12px;color:#666;font-size:13px;">
        陪玩「{{ gamesTarget?.nickname }}」可接的游戏项目，勾选后在老板端和陪玩端同步显示
      </div>
      <el-checkbox-group v-model="selectedGameIds" style="display:flex;flex-direction:column;gap:8px;">
        <el-checkbox v-for="g in allGames" :key="g.id" :value="g.id" :label="g.id">
          {{ g.name }}
        </el-checkbox>
      </el-checkbox-group>
      <template #footer>
        <el-button @click="gamesDialog = false">取消</el-button>
        <el-button type="primary" @click="saveGames" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProviderAdminList, adminUpdateProvider, updateProviderRank, banProvider, deleteProvider, getSystemConfig, getProviderGames, setProviderGames, getGameList } from '@/api'

const loading = ref(false)
const saving = ref(false)
const list = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const status = ref('')
const rankOptions = ref<string[]>(['王者', '星耀', '钻石', '铂金', '黄金', '白银', '青铜'])

const loadRankOptions = async () => {
  try {
    const res: any = await getSystemConfig()
    const data = res.data || res
    if (data.rank_options) {
      const arr = JSON.parse(data.rank_options)
      if (Array.isArray(arr) && arr.length > 0) {
        rankOptions.value = arr.filter((r: string) => r && r.trim())
      }
    }
  } catch (e) {}
}

const editDialog = ref(false)
const editForm = reactive({ id: null as number | null, nickname: '', phone: '', bio: '', level: 1, rank: '' })

const rankDialog = ref(false)
const rankTarget = ref<any>(null)
const rankValue = ref('')

const gamesDialog = ref(false)
const gamesTarget = ref<any>(null)
const allGames = ref<any[]>([])
const selectedGameIds = ref<number[]>([])

const loadAllGames = async () => {
  try {
    const res: any = await getGameList()
    allGames.value = res.data || res || []
  } catch (e) {}
}

const loadList = async () => {
  loading.value = true
  try {
    const res: any = await getProviderAdminList({ page: page.value, pageSize: pageSize.value, keyword: keyword.value, status: status.value })
    const data = res.data || res
    list.value = data.list || []
    total.value = data.total || 0
  } finally { loading.value = false }
}

const openEdit = (row: any) => {
  Object.assign(editForm, {
    id: row.id,
    nickname: row.nickname,
    phone: row.phone || '',
    bio: row.bio || '',
    level: row.providerProfile?.level || 1,
    rank: row.providerProfile?.rank || '',
  })
  editDialog.value = true
}

const saveEdit = async () => {
  saving.value = true
  try {
    await adminUpdateProvider(editForm.id!, {
      nickname: editForm.nickname,
      phone: editForm.phone,
      bio: editForm.bio,
      level: editForm.level,
      rank: editForm.rank,
    })
    ElMessage.success('保存成功')
    editDialog.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

const openRank = (row: any) => {
  rankTarget.value = row
  rankValue.value = row.providerProfile?.rank || ''
  rankDialog.value = true
}

const openGames = async (row: any) => {
  gamesTarget.value = row
  selectedGameIds.value = []
  try {
    const res: any = await getProviderGames(row.id)
    const games = res.data || res || []
    selectedGameIds.value = games.map((g: any) => g.id)
  } catch (e) {}
  gamesDialog.value = true
}

const saveGames = async () => {
  saving.value = true
  try {
    await setProviderGames(gamesTarget.value.id, selectedGameIds.value)
    ElMessage.success('可接游戏已更新')
    gamesDialog.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally { saving.value = false }
}

const saveRank = async () => {
  if (!rankValue.value) { ElMessage.warning('请选择段位'); return }
  saving.value = true
  try {
    await updateProviderRank(rankTarget.value.id, rankValue.value)
    ElMessage.success('段位已更新')
    rankDialog.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  } finally { saving.value = false }
}

const toggleBan = async (row: any) => {
  const banned = row.status === 'ACTIVE'
  const action = banned ? '拉黑' : '解封'
  await ElMessageBox.confirm(`确定${action}陪玩「${row.nickname}」？`, '确认', { type: 'warning' })
  await banProvider(row.id, banned)
  ElMessage.success(`已${action}`)
  loadList()
}

const remove = async (row: any) => {
  await ElMessageBox.confirm(`确定删除陪玩「${row.nickname}」？此操作不可恢复，相关订单和钱包数据将级联删除！`, '确认删除', { type: 'error' })
  await deleteProvider(row.id)
  ElMessage.success('已删除')
  loadList()
}

onMounted(() => {
  loadRankOptions()
  loadAllGames()
  loadList()
})
</script>

<style scoped>
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-title { font-size: 18px; font-weight: 600; }
</style>
