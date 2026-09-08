<template>
  <div class="order-create">
    <van-nav-bar :title="fromProvider ? '陪玩下单' : '确认订单'" left-arrow @click-left="$router.back()" />

    <!-- 陪玩模式：陪玩信息 -->
    <van-cell-group inset v-if="fromProvider" style="margin-top: 12px;">
      <van-cell title="游戏" :value="gameName" />
      <van-cell title="当前陪玩" :value="providerName" />
      <van-cell title="当前陪玩单价" :value="providerPrice + ' 星石/小时'" />
    </van-cell-group>

    <!-- 陪玩模式：单陪/双陪切换 -->
    <van-cell-group inset v-if="fromProvider" title="接单模式" style="margin-top: 12px;">
      <van-cell
        title="单陪"
        :label="`仅 ${providerName} 一人服务`"
        is-link
        @click="playMode = 'single'"
      >
        <template #right-icon>
          <van-icon v-if="playMode === 'single'" name="success" color="#07c160" />
        </template>
      </van-cell>
      <van-cell
        title="双陪"
        :label="secondProvider ? `已选：${secondProvider.nickname}` : '点击选择第二位陪玩'"
        is-link
        @click="playMode = 'double'; if (!secondProvider) openSecondPicker()"
      >
        <template #right-icon>
          <van-icon v-if="playMode === 'double'" name="success" color="#07c160" />
        </template>
      </van-cell>
      <van-cell v-if="playMode === 'double' && secondProvider" title="第二位陪玩单价" :value="secondProviderPrice + ' 星石/小时'" />
    </van-cell-group>

    <!-- 商品模式：商品信息 -->
    <van-cell-group inset v-if="!fromProvider && productName" style="margin-top: 12px;">
      <van-cell title="商品" :value="productName" />
      <van-cell title="单价" :value="productPrice + ' 星石'" />
    </van-cell-group>

    <!-- 商品模式：陪玩选择 -->
    <van-cell-group inset v-if="!fromProvider" title="选择陪玩" style="margin-top: 12px;">
      <van-cell
        title="暂不选择"
        :value="assignMode === 'none' ? '已选' : ''"
        is-link
        @click="assignMode = 'none'; selectedProviders = []"
      >
        <template #right-icon>
          <van-icon v-if="assignMode === 'none'" name="success" color="#07c160" />
        </template>
      </van-cell>
      <van-cell
        title="指定陪玩（可指定自己喜欢的1-2名陪陪）"
        :value="selectedProviders.length > 0 ? selectedProviders.length + '人' : ''"
        is-link
        @click="openProviderPicker"
      >
        <template #right-icon>
          <van-icon v-if="assignMode === '指定'" name="success" color="#07c160" />
        </template>
      </van-cell>
      <div v-if="selectedProviders.length > 0" class="selected-providers">
        <van-tag v-for="p in selectedProviders" :key="p.id" closable type="primary" @close="removeProvider(p)">
          {{ p.nickname }}
        </van-tag>
      </div>
    </van-cell-group>

    <van-form @submit="handleSubmit">
      <van-cell-group inset title="订单信息" style="margin-top: 12px;">
        <van-field name="duration" label="时长(小时)" :model-value="form.duration" type="digit" @update:model-value="v => form.duration = Number(v)" />
        <van-field label="总计">
          <template #input>
            <span style="color: #f5576c; font-weight: 600; font-size: 18px;">{{ totalAmount }} 星石</span>
          </template>
        </van-field>
      </van-cell-group>

      <van-cell-group inset title="联系方式" style="margin-top: 12px;">
        <van-field label="联系类型" is-link readonly placeholder="选择" :model-value="contactTypeText" @click="showContactPicker = true" />
        <van-field v-model="form.contactValue" label="账号" placeholder="请输入游戏账号/QQ/微信" />
      </van-cell-group>

      <van-cell-group inset title="订单要求" style="margin-top: 12px;">
        <van-field v-model="form.requirement" type="textarea" label="备注" placeholder="如：上分目标、段位要求等" rows="3" autosize />
      </van-cell-group>

      <div style="padding: 16px;">
        <van-button round block type="primary" native-type="submit" :loading="loading">
          确认下单（{{ totalAmount }}星石）
        </van-button>
        <p style="text-align: center; font-size: 12px; color: #999; margin-top: 12px;">
          下单后星石将被冻结，服务完成审核通过后结算给陪玩
        </p>
      </div>
    </van-form>

    <!-- 第二位陪玩选择弹窗 -->
    <van-popup v-model:show="showSecondPicker" position="bottom" round style="height: 70%;">
      <div class="picker-header">
        <span>选择第二位陪玩</span>
        <van-button size="small" type="primary" @click="confirmSecond">确定</van-button>
      </div>
      <div class="provider-list">
        <div
          v-for="p in providers"
          :key="p.id"
          class="provider-item"
          :class="{ selected: tempSecondId === p.id }"
          @click="selectSecond(p)"
        >
          <van-image round width="48" height="48" :src="p.avatar || defaultAvatar" />
          <div class="provider-info">
            <div class="name">{{ p.nickname }}</div>
            <div class="meta">{{ p.providerProfile?.rank || '未设置' }} · {{ p._price ? p._price + '星石/小时' : '未定价' }}</div>
          </div>
          <van-icon v-if="tempSecondId === p.id" name="success" color="#07c160" />
        </div>
        <div v-if="providers.length === 0" style="text-align: center; color: #999; padding: 40px;">暂无店内陪玩</div>
      </div>
    </van-popup>

    <!-- 商品模式陪玩选择弹窗 -->
    <van-popup v-model:show="showProviderPicker" position="bottom" round style="height: 70%;">
      <div class="picker-header">
        <span>选择陪玩（最多2人）</span>
        <van-button size="small" type="primary" @click="confirmProviders">确定</van-button>
      </div>
      <div class="provider-list">
        <div
          v-for="p in providers"
          :key="p.id"
          class="provider-item"
          :class="{ selected: tempSelected.includes(p.id) }"
          @click="toggleProvider(p)"
        >
          <van-image round width="48" height="48" :src="p.avatar || defaultAvatar" />
          <div class="provider-info">
            <div class="name">{{ p.nickname }}</div>
            <div class="meta">{{ p.providerProfile?.rank || '未设置' }} · {{ p.providerProfile?.games?.length || 0 }}款游戏</div>
          </div>
          <van-icon v-if="tempSelected.includes(p.id)" name="success" color="#07c160" />
        </div>
        <div v-if="providers.length === 0" style="text-align: center; color: #999; padding: 40px;">暂无店内陪玩</div>
      </div>
    </van-popup>

    <!-- 联系方式选择 -->
    <van-popup v-model:show="showContactPicker" position="bottom" round>
      <van-picker :columns="contactOptions" @confirm="onContactConfirm" @cancel="showContactPicker = false" />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
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
const selectedProviders = ref<any[]>([])
const tempSelected = ref<number[]>([])
const assignMode = ref<'none' | '指定'>('none')
const showProviderPicker = ref(false)

const showContactPicker = ref(false)

const form = reactive({
  serviceItemId: 0,
  gameId: gameId || 0,
  duration: 1,
  contactType: 'QQ',
  contactValue: '',
  requirement: fromProvider ? `游戏：${gameName}` : (productName ? `购买商品：${productName}` : ''),
})

const contactOptions = [
  { text: 'QQ', value: 'QQ' },
  { text: '微信', value: 'WECHAT' },
  { text: '游戏ID', value: 'GAME_ID' },
]
const contactTypeText = computed(() => contactOptions.find(o => o.value === form.contactType)?.text || '')

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
    // 陪玩模式下排除当前陪玩，并为每个陪玩加载该游戏的价格
    if (fromProvider && gameId) {
      providers.value = list.filter((p: any) => p.id !== providerId)
      // 为每个陪玩加载价格
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
  // 商品模式：获取第一个服务项目
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
  if (!tempSecondId.value) { showToast('请选择第二位陪玩'); return }
  const p = providers.value.find(x => x.id === tempSecondId.value)
  if (!p) return
  if (!p._price || p._price <= 0) { showToast('该陪玩未设置此游戏价格'); return }
  secondProvider.value = p
  secondProviderPrice.value = p._price
  showSecondPicker.value = false
}
const openSecondPicker = () => {
  tempSecondId.value = secondProvider.value?.id || 0
  showSecondPicker.value = true
}

// 商品模式陪玩选择
const toggleProvider = (p: any) => {
  const idx = tempSelected.value.indexOf(p.id)
  if (idx > -1) {
    tempSelected.value.splice(idx, 1)
  } else {
    if (tempSelected.value.length >= 2) { showToast('最多选择2位陪玩'); return }
    tempSelected.value.push(p.id)
  }
}
const confirmProviders = () => {
  if (tempSelected.value.length === 0) { showToast('请至少选择1位陪玩'); return }
  selectedProviders.value = providers.value.filter(p => tempSelected.value.includes(p.id))
  assignMode.value = '指定'
  showProviderPicker.value = false
}
const removeProvider = (p: any) => {
  selectedProviders.value = selectedProviders.value.filter(x => x.id !== p.id)
  if (selectedProviders.value.length === 0) assignMode.value = 'none'
}
const openProviderPicker = () => {
  tempSelected.value = selectedProviders.value.map(p => p.id)
  showProviderPicker.value = true
}

const onContactConfirm = ({ selectedOptions }: any) => {
  form.contactType = selectedOptions[0].value
  showContactPicker.value = false
}

const handleSubmit = async () => {
  if (!form.contactValue) { showToast('请输入联系方式'); return }
  if (fromProvider && playMode.value === 'double' && !secondProvider.value) {
    showToast('请选择第二位陪玩'); return
  }
  if (!fromProvider && !form.serviceItemId) { showToast('服务项目加载中，请稍后'); return }

  const wallet: any = await getWallet()
  if (wallet.balance < totalAmount.value) {
    await showConfirmDialog({
      title: '余额不足',
      message: `当前余额 ${wallet.balance} 星石，需要 ${totalAmount.value} 星石，请联系客服充值`,
      confirmButtonText: '知道了',
      showCancelButton: false,
    })
    return
  }

  loading.value = true
  try {
    if (fromProvider) {
      // 陪玩模式
      if (playMode.value === 'single') {
        const res: any = await createOrder({
          ...form,
          providerId,
          title: `${gameName}陪玩`,
          overridePrice: providerPrice,
          productName: gameName,
        })
        showToast('下单成功')
        router.replace(`/order/${res.id}`)
      } else {
        // 双陪：创建两个订单
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
          })
          if (i === 0) firstId = res.id
        }
        showToast('双陪下单成功')
        router.replace(`/order/${firstId}`)
      }
    } else {
      // 商品模式
      if (selectedProviders.value.length === 0) {
        const res: any = await createOrder({
          ...form,
          title: productName || '陪玩订单',
          overridePrice: productPrice || undefined,
          productName,
        })
        showToast('下单成功，等待陪玩接单')
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
        showToast(`已为${selectedProviders.value.length}位陪玩下单`)
        router.replace(`/order/${firstOrderId}`)
      }
    }
  } catch (e: any) {
    showToast(e?.response?.data?.message || '下单失败')
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.order-create { padding-bottom: 20px; }
.selected-providers { display: flex; flex-wrap: wrap; gap: 8px; padding: 12px 16px; }
.picker-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #f0f0f0; font-weight: 600; }
.provider-list { padding: 8px 16px; max-height: calc(70vh - 60px); overflow-y: auto; }
.provider-item { display: flex; align-items: center; gap: 12px; padding: 12px 8px; border-bottom: 1px solid #f5f5f5; }
.provider-item.selected { background: #e8f5e9; border-radius: 8px; }
.provider-info { flex: 1; }
.provider-info .name { font-size: 15px; font-weight: 500; }
.provider-info .meta { font-size: 12px; color: #999; margin-top: 2px; }
</style>
