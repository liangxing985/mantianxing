<template>
  <div class="order-create">
    <van-nav-bar title="创建订单" left-arrow @click-left="$router.back()" />
    <van-form @submit="handleSubmit">
      <van-cell-group inset title="选择服务">
        <van-field name="serviceItemId" label="服务项目" :model-value="selectedService?.serviceItem?.name" placeholder="请选择" is-link readonly @click="showServicePicker = true" />
        <van-field name="duration" label="数量" :model-value="form.duration" placeholder="请输入" type="digit" @update:model-value="v => form.duration = Number(v)" />
        <van-field label="单价" :model-value="selectedService?.price + ' 星石'" readonly />
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

    <!-- 服务选择弹窗 -->
    <van-popup v-model:show="showServicePicker" position="bottom" round>
      <van-picker
        :columns="serviceColumns"
        @confirm="onServiceConfirm"
        @cancel="showServicePicker = false"
      />
    </van-popup>

    <!-- 联系方式选择 -->
    <van-popup v-model:show="showContactPicker" position="bottom" round>
      <van-picker
        :columns="contactOptions"
        @confirm="onContactConfirm"
        @cancel="showContactPicker = false"
      />
    </van-popup>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { getProviderDetail, createOrder, getWallet } from '@/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const provider = ref<any>(null)
const services = ref<any[]>([])
const selectedService = ref<any>(null)
const showServicePicker = ref(false)
const showContactPicker = ref(false)

const form = reactive({
  providerId: Number(route.query.providerId) || 0,
  serviceItemId: 0,
  duration: 1,
  contactType: 'QQ',
  contactValue: '',
  requirement: '',
})

const serviceColumns = computed(() => services.value.map(s => ({ text: `${s.serviceItem?.name} - ${s.price}星石`, value: s })))
const contactOptions = [
  { text: 'QQ', value: 'QQ' },
  { text: '微信', value: 'WECHAT' },
  { text: '游戏ID', value: 'GAME_ID' },
]
const contactTypeText = computed(() => contactOptions.find(o => o.value === form.contactType)?.text || '')
const totalAmount = computed(() => (selectedService.value?.price || 0) * form.duration)

const loadData = async () => {
  const detail: any = await getProviderDetail(form.providerId)
  provider.value = detail
  services.value = detail.providerProfile?.services?.filter((s: any) => s.isEnabled) || []
  if (services.value.length > 0) {
    selectedService.value = services.value[0]
    form.serviceItemId = services.value[0].serviceItemId
  }
}

const onServiceConfirm = ({ selectedOptions }: any) => {
  selectedService.value = selectedOptions[0].value
  form.serviceItemId = selectedService.value.serviceItemId
  showServicePicker.value = false
}

const onContactConfirm = ({ selectedOptions }: any) => {
  form.contactType = selectedOptions[0].value
  showContactPicker.value = false
}

const handleSubmit = async () => {
  if (!form.serviceItemId) { showToast('请选择服务项目'); return }
  if (!form.contactValue) { showToast('请输入联系方式'); return }

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
    const res: any = await createOrder(form)
    showToast('下单成功')
    router.replace(`/order/${res.id}`)
  } finally {
    loading.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.order-create { padding-bottom: 20px; }
</style>
