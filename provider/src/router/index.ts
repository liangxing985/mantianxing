import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { noTab: true } },
  { path: '/register', component: () => import('@/views/Register.vue'), meta: { noTab: true } },
  {
    path: '/',
    component: () => import('@/layouts/TabLayout.vue'),
    redirect: '/pool',
    children: [
      { path: 'pool', component: () => import('@/views/OrderPool.vue'), meta: { title: '抢单', icon: 'fire-o' } },
      { path: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '订单', icon: 'orders-o' } },
      { path: 'wallet', component: () => import('@/views/Wallet.vue'), meta: { title: '钱包', icon: 'balance-o' } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '我的', icon: 'user-o' } },
    ],
  },
  { path: '/order/:id', component: () => import('@/views/OrderDetail.vue'), meta: { noTab: true } },
  { path: '/services', component: () => import('@/views/Services.vue'), meta: { noTab: true } },
  { path: '/my-games', component: () => import('@/views/MyGames.vue'), meta: { noTab: true } },
  { path: '/messages', component: () => import('@/views/Messages.vue'), meta: { noTab: true } },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('provider_token')
  if (!token && !['/login', '/register'].includes(to.path)) next('/login')
  else next()
})

export default router
