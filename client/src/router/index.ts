import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { noTab: true } },
  { path: '/register', component: () => import('@/views/Register.vue'), meta: { noTab: true } },
  {
    path: '/',
    component: () => import('@/layouts/TabLayout.vue'),
    redirect: '/home',
    children: [
      { path: 'home', component: () => import('@/views/Home.vue'), meta: { title: '首页', icon: 'home-o' } },
      { path: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '订单', icon: 'orders-o', requiresAuth: true } },
      { path: 'wallet', component: () => import('@/views/Wallet.vue'), meta: { title: '钱包', icon: 'balance-o', requiresAuth: true } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '我的', icon: 'user-o' } },
    ],
  },
  { path: '/provider/:id', component: () => import('@/views/ProviderDetail.vue'), meta: { noTab: true } },
  { path: '/providers', component: () => import('@/views/ProviderList.vue'), meta: { noTab: true } },
  { path: '/order/create', component: () => import('@/views/OrderCreate.vue'), meta: { noTab: true, requiresAuth: true } },
  { path: '/order/:id', component: () => import('@/views/OrderDetail.vue'), meta: { noTab: true, requiresAuth: true } },
  { path: '/withdraw', component: () => import('@/views/Withdraw.vue'), meta: { noTab: true, requiresAuth: true } },
  { path: '/messages', component: () => import('@/views/Messages.vue'), meta: { noTab: true, requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('client_token')
  // 需要登录的页面才检查 token
  if (to.meta.requiresAuth && !token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
