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
        path: 'game-categories',
        name: 'GameCategories',
        component: () => import('@/views/GameCategoryManage.vue'),
        meta: { title: '游戏分类', icon: 'Menu' },
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
      {
        path: 'data-dashboard',
        name: 'DataDashboard',
        component: () => import('@/views/DataDashboard.vue'),
        meta: { title: '详细数据看板', icon: 'DataLine' },
      },
      {
        path: 'manual-assign',
        name: 'ManualAssign',
        component: () => import('@/views/ManualAssign.vue'),
        meta: { title: '客服派单', icon: 'Promotion' },
      },
      {
        path: 'membership-manage',
        name: 'MembershipManage',
        component: () => import('@/views/MembershipManage.vue'),
        meta: { title: '会员管理', icon: 'Star' },
      },
      {
        path: 'gift-manage',
        name: 'GiftManage',
        component: () => import('@/views/GiftManage.vue'),
        meta: { title: '礼物管理', icon: 'Present' },
      },
      {
        path: 'tag-manage',
        name: 'TagManage',
        component: () => import('@/views/TagManage.vue'),
        meta: { title: '标签管理', icon: 'CollectionTag' },
      },
      {
        path: 'coupon-manage',
        name: 'CouponManage',
        component: () => import('@/views/CouponManage.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' },
      },
      {
        path: 'banner-manage',
        name: 'BannerManage',
        component: () => import('@/views/BannerManage.vue'),
        meta: { title: '轮播图管理', icon: 'Picture' },
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
