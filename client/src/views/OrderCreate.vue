<template>
  <div class="order-create-page">
    <div class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1 class="page-title">{{ fromProvider ? '陪玩下单' : '确认订单' }}</h1>
    </div>

    <div class="order-content">
      <!-- 左侧：表单区域 -->
      <div class="form-section">
        <!-- 陪玩模式：陪玩信息 -->
        <div v-if="fromProvider" class="card">
          <h3 class="card-title">服务信息</h3>
          <div class="info-row">
            <span class="info-label">游戏</span>
            <span class="info-value">{{ gameName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">当前陪玩</span>
            <span class="info-value">{{ providerName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">陪玩单价</span>
            <span class="info-value price">{{ providerPrice }} 星石/小时</span>
          </div>
        </div>

        <!-- 陪玩模式：单陪/双陪切换 -->
        <div v-if="fromProvider" class="card">
          <h3 class="card-title">接单模式</h3>
          <div class="mode-options">
            <div
              class="mode-option"
              :class="{ active: playMode === 'single' }"
              @click="playMode = 'single'"
            >
              <div class="mode-radio">
                <span v-if="playMode === 'single'" class="radio-dot"></span>
              </div>
              <div class="mode-info">
                <div class="mode-name">单陪</div>
                <div class="mode-desc">仅 {{ providerName }} 一人服务</div>
              </div>
            </div>
            <div
              class="mode-option"
              :class="{ active: playMode === 'double' }"
              @click="playMode = 'double'; if (!secondProvider) showSecondPicker = true"
            >
              <div class="mode-radio">
                <span v-if="playMode === 'double'" class="radio-dot"></span>
              </div>
              <div class="mode-info">
                <div class="mode-name">双陪</div>
                <div class="mode-desc">{{ secondProvider ? `已选：${secondProvider.nickname}` : '点击选择第二位陪玩' }}</div>
              </div>
            </div>
          </div>
          <div v-if="playMode === 'double' && secondProvider" class="info-row" style="margin-top: 12px;">
            <span class="info-label">第二位陪玩单价</span>
            <span class="info-value price">{{ secondProviderPrice }} 星石/小时</span>
          </div>
        </div>

        <!-- 商品模式：陪玩选择 -->
        <div v-if="!fromProvider" class="card">
          <h3 class="card-title">选择陪玩</h3>
          <div class="mode-options">
            <div
              class="mode-option"
              :class="{ active: assignMode === 'none' }"
              @click="assignMode = 'none'; selectedProviders = []"
            >
              <div class="mode-radio">
                <span v-if="assignMode === 'none'" class="radio-dot"></span>
              </div>
              <div class="mode-info">
                <div class="mode-name">暂不选择</div>
                <div class="mode-desc">系统自动分配陪玩</div>
              </div>
            </div>
            <div
              class="mode-option"
              :class="{ active: assignMode === '指定' }"
              @click="showProviderPicker = true"
            >
              <div class="mode-radio">
                <span v-if="assignMode === '指定'" class="radio-dot"></span>
              </div>
              <div class="mode-info">
                <div class="mode-name">指定陪玩</div>
                <div class="mode-desc">可指定自己喜欢的1-2名陪陪</div>
              </div>
            </div>
          </div>
          <div v-if="selectedProviders.length > 0" class="selected-tags">
            <span v-for="p in selectedProviders" :key="p.id" class="tag-item">
              {{ p.nickname }}
              <button class="tag-close" @click="removeProvider(p)">×</button>
            </span>
          </div>
        </div>

        <!-- 订单信息 -->
        <div class="card">
          <h3 class="card-title">订单信息</h3>
          <template v-if="!fromProvider && productName">
            <div class="info-row">
              <span class="info-label">商品</span>
              <span class="info-value">{{ productName }}</span>
            </div>
            <div v-if="productGameName" class="info-row">
              <span class="info-label">游戏</span>
              <span class="info-value">{{ productGameName }}</span>
            </div>
            <div v-if="productDescription" class="info-row">
              <span class="info-label">描述</span>
              <span class="info-value">{{ productDescription }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">单价</span>
              <span class="info-value price">{{ productPrice }} 星石</span>
            </div>
          </template>
          <div class="form-row">
            <label class="form-label">时长（小时）</label>
            <input
              type="number"
              class="form-input"
              v-model.number="form.duration"
              min="1"
              max="24"
            />
          </div>
          <div class="form-row">
            <label class="form-label">总计</label>
            <span class="total-price">{{ totalAmount }} 星石</span>
          </div>
        </div>

        <!-- 联系方式 -->
        <div class="card">
          <h3 class="card-title">联系方式</h3>
          <div class="form-row">
            <label class="form-label">联系类型</label>
            <select class="form-select" v-model="form.contactType">
              <option value="QQ">QQ</option>
              <option value="WECHAT">微信</option>
              <option value="GAME_ID">游戏ID</option>
            </select>
          </div>
          <div class="form-row">
            <label class="form-label">账号</label>
            <input
              type="text"
              class="form-input"
              v-model="form.contactValue"
              placeholder="请输入游戏账号/QQ/微信"
            />
          </div>
        </div>

        <!-- 订单要求 -->
        <div class="card">
          <h3 class="card-title">订单要求</h3>
          <textarea
            class="form-textarea"
            v-model="form.requirement"
            placeholder="如：上分目标、段位要求等"
            rows="3"
          ></textarea>
        </div>
      </div>

      <!-- 右侧：订单摘要 -->
      <div class="summary-section">
        <div class="card summary-card">
          <h3 class="card-title">订单摘要</h3>
          <div class="summary-row">
            <span>服务类型</span>
            <span>{{ fromProvider ? '陪玩服务' : '商品服务' }}</span>
          </div>
          <div class="summary-row">
            <span>时长</span>
            <span>{{ form.duration }} 小时</span>
          </div>
          <div v-if="fromProvider && playMode === 'double'" class="summary-row">
            <span>陪玩人数</span>
            <span>双陪（2人）</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-total">
            <span>应付金额</span>
            <span class="total-amount">{{ totalAmount }} 星石</span>
          </div>
          <button class="submit-btn" @click="handleSubmit" :disabled="loading">
            <span v-if="loading">提交中...</span>
            <span v-else>确认下单（{{ totalAmount }}星石）</span>
          </button>
          <p class="submit-tip">下单后星石将被冻结，服务完成审核通过后结算给陪玩</p>
        </div>
      </div>
    </div>

    <!-- 第二位陪玩选择弹窗 -->
    <div v-if="showSecondPicker" class="modal-overlay" @click.self="showSecondPicker = false">
      <div class="modal">
        <div class="modal-header">
          <h3>选择第二位陪玩</h3>
          <button class="modal-close" @click="showSecondPicker = false">×</button>
        </div>
        <div class="modal-body">
          <div
            v-for="p in providers"
            :key="p.id"
            class="provider-item"
            :class="{ selected: tempSecondId === p.id }"
            @click="selectSecond(p)"
          >
            <img :src="p.avatar || defaultAvatar" class="provider-avatar" />
            <div class="provider-info">
              <div class="name">{{ p.nickname }}</div>
              <div class="meta">{{ p.providerProfile?.rank || '未设置' }} · {{ p._price ? p._price + '星石/小时' : '未定价' }}</div>
            </div>
            <span v-if="tempSecondId === p.id" class="check-icon">✓</span>
          </div>
          <div v-if="providers.length === 0" class="empty-text">暂无店内陪玩</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showSecondPicker = false">取消</button>
          <button class="btn-primary" @click="confirmSecond">确定</button>
        </div>
      </div>
    </div>

    <!-- 商品模式陪玩选择弹窗 -->
    <div v-if="showProviderPicker" class="modal-overlay" @click.self="showProviderPicker = false">
      <div class="modal">
        <div class="modal-header">
          <h3>选择陪玩（最多2人）</h3>
          <button class="modal-close" @click="showProviderPicker = false">×</button>
        </div>
        <div class="modal-body">
          <div
            v-for="p in providers"
            :key="p.id"
            class="provider-item"
            :class="{ selected: tempSelected.includes(p.id) }"
            @click="toggleProvider(p)"
          >
            <img :src="p.avatar || defaultAvatar" class="provider-avatar" />
            <div class="provider-info">
              <div class="name">{{ p.nickname }}</div>
              <div class="meta">{{ p.providerProfile?.rank || '未设置' }} · {{ p.providerProfile?.games?.length || 0 }}款游戏</div>
            </div>
            <span v-if="tempSelected.includes(p.id)" class="check-icon">✓</span>
          </div>
          <div v-if="providers.length === 0" class="empty-text">暂无店内陪玩</div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showProviderPicker = false">取消</button>
          <button class="btn-primary" @click="confirmProviders">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getProviderList, createOrder, getWallet, getGameList, getProviderDetail } from '@/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const providers = ref<any[]>([])
const defaultAvatar = 'https://fastly.jsdelivr.net/npm/@vant/assets/cat.jpeg'

// 模式判断
const fromProvider = route.query.fromProvider === '1'

// 陪玩模式参数
const providerId = Number(route.query.providerId) || 0
const providerName = route.query.providerName as string || ''
const providerPrice = Number(route.query.price) || 0
const gameId = Number(route.query.gameId) || 0
const gameName = route.query.gameName as string || ''
const playMode = ref<'single' | 'double'>('single')
const secondProvider = ref<any>(null)
const secondProviderPrice = ref(0)
const showSecondPicker = ref(false)
const tempSecondId = ref(0)

// 商品模式参数
const productName = route.query.productName as string || ''
const productPrice = Number(route.query.price) || 0
const productId = Number(route.query.productId) || 0
const productGameId = Number(route.query.gameId) || 0
const productGameName = route.query.gameName as string || ''
const productDescription = route.query.description as string || ''
const selectedProviders = ref<any[]>([])
const tempSelected = ref<number[]>([])
const assignMode = ref<'none' | '指定'>('none')
const showProviderPicker = ref(false)

const form = reactive({
  serviceItemId: 0,
  gameId: gameId || productGameId || 0,
  duration: 1,
  contactType: 'QQ',
  contactValue: '',
  requirement: '',
})

// 总价计算
const totalAmount = computed(() => {
  if (fromProvider) {
    const unitPrice = playMode.value === 'double'
      ? (providerPrice + secondProviderPrice.value)
      : providerPrice
    return unitPrice * form.duration
  }
  return productPrice * form.duration
})

const loadData = async () => {
  try {
    const res: any = await getProviderList({ page: 1, pageSize: 50, isOnline: true })
    const list = res.list || res.data?.list || []
    if (fromProvider && gameId) {
      providers.value = list.filter((p: any) => p.id !== providerId)
      for (const p of providers.value) {
        try {
          const detail: any = await getProviderDetail(p.id)
          const priced = detail.providerProfile?.pricedServices || []
          const match = priced.find((s: any) => s.gameId === gameId)
          p._price = match?.price || 0
        } catch (e) { p._price = 0 }
      }
    } else {
      providers.value = list
    }
  } catch (e) {
    providers.value = []
  }
  if (!fromProvider) {
    try {
      const games: any = await getGameList()
      const gameList = Array.isArray(games) ? games : (games?.data || [])
      if (gameList.length > 0 && gameList[0].serviceItems?.length > 0) {
        form.serviceItemId = gameList[0].serviceItems[0].id
        form.gameId = gameList[0].id
      }
    } catch (e) {}
  }
}

// 第二位陪玩选择
const selectSecond = (p: any) => {
  tempSecondId.value = p.id
}
const confirmSecond = () => {
  if (!tempSecondId.value) { alert('请选择第二位陪玩'); return }
  const p = providers.value.find(x => x.id === tempSecondId.value)
  if (!p) return
  if (!p._price || p._price <= 0) { alert('该陪玩未设置此游戏价格'); return }
  secondProvider.value = p
  secondProviderPrice.value = p._price
  showSecondPicker.value = false
}

// 商品模式陪玩选择
const toggleProvider = (p: any) => {
  const idx = tempSelected.value.indexOf(p.id)
  if (idx > -1) {
    tempSelected.value.splice(idx, 1)
  } else {
    if (tempSelected.value.length >= 2) { alert('最多选择2位陪玩'); return }
    tempSelected.value.push(p.id)
  }
}
const confirmProviders = () => {
  if (tempSelected.value.length === 0) { alert('请至少选择1位陪玩'); return }
  selectedProviders.value = providers.value.filter(p => tempSelected.value.includes(p.id))
  assignMode.value = '指定'
  showProviderPicker.value = false
}
const removeProvider = (p: any) => {
  selectedProviders.value = selectedProviders.value.filter(x => x.id !== p.id)
  if (selectedProviders.value.length === 0) assignMode.value = 'none'
}

const handleSubmit = async () => {
  if (!form.contactValue) { alert('请输入联系方式'); return }
  if (fromProvider && playMode.value === 'double' && !secondProvider.value) {
    alert('请选择第二位陪玩'); return
  }
  if (!fromProvider && !form.serviceItemId) { alert('服务项目加载中，请稍后'); return }

  const wallet: any = await getWallet()
  if (wallet.balance < totalAmount.value) {
    alert(`当前余额 ${wallet.balance} 星石，需要 ${totalAmount.value} 星石，请联系客服充值`)
    return
  }

  loading.value = true
  try {
    if (fromProvider) {
      if (playMode.value === 'single') {
        const res: any = await createOrder({
          ...form,
          providerId,
          title: `${gameName}陪玩`,
          overridePrice: providerPrice,
          productName: gameName,
        })
        alert('下单成功')
        router.replace(`/order/${res.id}`)
      } else {
        const orderGroup = `GRP${Date.now()}${Math.floor(Math.random() * 1000)}`
        const orders = [
          { providerId, price: providerPrice },
          { providerId: secondProvider.value.id, price: secondProviderPrice.value },
        ]
        let firstId = 0
        for (let i = 0; i < orders.length; i++) {
          const res: any = await createOrder({
            ...form,
            providerId: orders[i].providerId,
            title: `${gameName}双陪`,
            overridePrice: orders[i].price,
            productName: gameName,
            orderGroup,
          })
          if (i === 0) firstId = res.id
        }
        alert('双陪下单成功')
        router.replace(`/order/${firstId}`)
      }
    } else {
      if (selectedProviders.value.length === 0) {
        const res: any = await createOrder({
          ...form,
          title: productName || '陪玩订单',
          overridePrice: productPrice || undefined,
          productName,
        })
        alert('下单成功，等待陪玩接单')
        router.replace(`/order/${res.id}`)
      } else {
        let firstOrderId = 0
        for (let i = 0; i < selectedProviders.value.length; i++) {
          const p = selectedProviders.value[i]
          const res: any = await createOrder({
            ...form,
            providerId: p.id,
            title: productName || '陪玩订单',
            overridePrice: productPrice || undefined,
            productName,
          })
          if (i === 0) firstOrderId = res.id
        }
        alert(`已为${selectedProviders.value.length}位陪玩下单`)
        router.replace(`/order/${firstOrderId}`)
      }
    }
  } catch (e: any) {
    alert(e?.response?.data?.message || '下单失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.order-create-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: #6c5ce7;
  font-size: 15px;
  cursor: pointer;
  padding: 8px 16px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #f5f3ff;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.order-content {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
  align-items: start;
}

.card {
  background: #fff;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0 0 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
}

.info-label {
  color: #999;
  font-size: 14px;
}

.info-value {
  color: #333;
  font-size: 14px;
  font-weight: 500;
}

.info-value.price {
  color: #f5222d;
  font-weight: 600;
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mode-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid #e8e8e8;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: #c4b5fd;
}

.mode-option.active {
  border-color: #6c5ce7;
  background: #faf8ff;
}

.mode-radio {
  width: 20px;
  height: 20px;
  border: 2px solid #d9d9d9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.mode-option.active .mode-radio {
  border-color: #6c5ce7;
}

.radio-dot {
  width: 10px;
  height: 10px;
  background: #6c5ce7;
  border-radius: 50%;
}

.mode-info {
  flex: 1;
}

.mode-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
}

.mode-desc {
  font-size: 13px;
  color: #999;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #f5f3ff;
  color: #6c5ce7;
  padding: 6px 12px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.tag-close {
  background: none;
  border: none;
  color: #6c5ce7;
  font-size: 16px;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-label {
  width: 100px;
  color: #666;
  font-size: 14px;
  flex-shrink: 0;
}

.form-input, .form-select {
  flex: 1;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
  outline: none;
}

.form-input:focus, .form-select:focus {
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108,92,231,0.1);
}

.form-textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  outline: none;
  font-family: inherit;
}

.form-textarea:focus {
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108,92,231,0.1);
}

.total-price {
  font-size: 22px;
  font-weight: 700;
  color: #f5222d;
}

/* 右侧摘要 */
.summary-section {
  position: sticky;
  top: 88px;
}

.summary-card {
  margin-bottom: 0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
  color: #666;
}

.summary-divider {
  height: 1px;
  background: #f0f0f0;
  margin: 12px 0;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.summary-total span:first-child {
  font-size: 15px;
  color: #333;
  font-weight: 500;
}

.total-amount {
  font-size: 28px;
  font-weight: 700;
  color: #f5222d;
}

.submit-btn {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(108,92,231,0.4);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.submit-tip {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin: 12px 0 0;
}

/* 弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 16px;
  width: 560px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #f0f0f0;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.modal-close {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  line-height: 1;
  padding: 0;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px 24px;
}

.provider-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.2s;
}

.provider-item:hover {
  background: #fafafa;
}

.provider-item.selected {
  background: #f0f9ff;
}

.provider-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.provider-info {
  flex: 1;
}

.provider-info .name {
  font-size: 15px;
  font-weight: 500;
  color: #333;
}

.provider-info .meta {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.check-icon {
  width: 24px;
  height: 24px;
  background: #6c5ce7;
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
}

.empty-text {
  text-align: center;
  color: #999;
  padding: 40px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #f0f0f0;
}

.btn-primary {
  padding: 10px 24px;
  background: linear-gradient(135deg, #6c5ce7, #a29bfe);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary {
  padding: 10px 24px;
  background: #f5f5f5;
  color: #666;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
}

@media (max-width: 900px) {
  .order-content {
    grid-template-columns: 1fr;
  }
  .summary-section {
    position: static;
  }
}
</style>
