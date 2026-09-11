import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { noTab: true } },
  { path: '/register', component: () => import('@/views/Register.vue'), meta: { noTab: true } },
  {
    path: '/',
    component: () => import('@/layouts/TabLayout.vue'),
    redirect: '/home',
    children: [
      { path: 'home', component: () => import('@/views/Home.vue'), meta: { title: '首页' } },
      { path: 'providers', component: () => import('@/views/ProviderList.vue'), meta: { title: '陪玩大厅' } },
      { path: 'provider/:id', component: () => import('@/views/ProviderDetail.vue'), meta: { title: '陪玩详情' } },
      { path: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '我的订单', requiresAuth: true } },
      { path: 'order/create', component: () => import('@/views/OrderCreate.vue'), meta: { title: '创建订单', requiresAuth: true } },
      { path: 'order/:id', component: () => import('@/views/OrderDetail.vue'), meta: { title: '订单详情', requiresAuth: true } },
      { path: 'wallet', component: () => import('@/views/Wallet.vue'), meta: { title: '我的钱包', requiresAuth: true } },
      { path: 'withdraw', component: () => import('@/views/Withdraw.vue'), meta: { title: '提现', requiresAuth: true } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '我的' } },
      { path: 'messages', component: () => import('@/views/Messages.vue'), meta: { title: '消息', requiresAuth: true } },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('client_token')
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
