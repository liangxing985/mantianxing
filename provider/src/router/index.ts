import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { noTab: true } },
  { path: '/register', component: () => import('@/views/Register.vue'), meta: { noTab: true } },
  {
    path: '/',
    component: () => import('@/layouts/TabLayout.vue'),
    redirect: '/pool',
    children: [
      { path: 'pool', component: () => import('@/views/OrderPool.vue'), meta: { title: '抢单大厅' } },
      { path: 'orders', component: () => import('@/views/Orders.vue'), meta: { title: '我的订单' } },
      { path: 'wallet', component: () => import('@/views/Wallet.vue'), meta: { title: '我的钱包' } },
      { path: 'profile', component: () => import('@/views/Profile.vue'), meta: { title: '个人中心' } },
      { path: 'order/:id', component: () => import('@/views/OrderDetail.vue'), meta: { title: '订单详情' } },
      { path: 'services', component: () => import('@/views/Services.vue'), meta: { title: '服务管理' } },
      { path: 'my-games', component: () => import('@/views/MyGames.vue'), meta: { title: '可接游戏' } },
      { path: 'messages', component: () => import('@/views/Messages.vue'), meta: { title: '消息通知' } },
    ],
  },
]

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('provider_token')
  if (!token && !['/login', '/register'].includes(to.path)) next('/login')
  else next()
})

export default router
