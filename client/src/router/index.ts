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
      { path: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '订单', icon: 'orders-o' } },
      { path: 'wallet', component: () => import('@/views/Wallet.vue'), meta: { title: '钱包', icon: 'balance-o' } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '我的', icon: 'user-o' } },
    ],
  },
  { path: '/provider/:id', component: () => import('@/views/ProviderDetail.vue'), meta: { noTab: true } },
  { path: '/providers', component: () => import('@/views/ProviderList.vue'), meta: { noTab: true } },
  { path: '/order/create', component: () => import('@/views/OrderCreate.vue'), meta: { noTab: true } },
  { path: '/order/:id', component: () => import('@/views/OrderDetail.vue'), meta: { noTab: true } },
  { path: '/messages', component: () => import('@/views/Messages.vue'), meta: { noTab: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('client_token')
  const noAuth = ['/login', '/register']
  if (!token && !noAuth.includes(to.path)) {
    next('/login')
  } else {
    next()
  }
})

export default router
