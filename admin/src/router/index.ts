import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
  },
  {
    path: '/',
    component: () => import('@/layouts/AdminLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览', icon: 'DataAnalysis' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/UserList.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'provider-apply',
        name: 'ProviderApply',
        component: () => import('@/views/ProviderApply.vue'),
        meta: { title: '陪玩审核', icon: 'Avatar' },
      },
      {
        path: 'providers',
        name: 'Providers',
        component: () => import('@/views/ProviderManage.vue'),
        meta: { title: '陪玩管理', icon: 'UserFilled' },
      },
      {
        path: 'products',
        name: 'Products',
        component: () => import('@/views/ProductManage.vue'),
        meta: { title: '商品管理', icon: 'Goods' },
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/ActivityManage.vue'),
        meta: { title: '活动管理', icon: 'Promotion' },
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/OrderList.vue'),
        meta: { title: '订单管理', icon: 'Document' },
      },
      {
        path: 'order-review',
        name: 'OrderReview',
        component: () => import('@/views/OrderReview.vue'),
        meta: { title: '报单审核', icon: 'Checked' },
      },
      {
        path: 'withdraw',
        name: 'Withdraw',
        component: () => import('@/views/WithdrawReview.vue'),
        meta: { title: '提现审核', icon: 'Money' },
      },
      {
        path: 'games',
        name: 'Games',
        component: () => import('@/views/GameManage.vue'),
        meta: { title: '游戏管理', icon: 'Game' },
      },
      {
        path: 'game-approvals',
        name: 'GameApprovals',
        component: () => import('@/views/GameApproval.vue'),
        meta: { title: '游戏审核', icon: 'Checked' },
      },
      {
        path: 'pricing',
        name: 'Pricing',
        component: () => import('@/views/PricingManage.vue'),
        meta: { title: '定价管理', icon: 'Money' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/SystemSettings.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token')
  if (to.path === '/login') {
    next()
  } else if (!token) {
    next('/login')
  } else {
    next()
  }
})

export default router
