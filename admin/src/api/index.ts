import request from '@/utils/request'

// 认证
export const login = (data: { username: string; password: string }) =>
  request.post('/auth/login', data)

export const getProfile = () => request.get('/auth/profile')

// 数据概览
export const getDashboard = () => request.get('/admin/dashboard')

// 用户管理
export const getUserList = (params: any) => request.get('/admin/users', { params })
export const toggleUserStatus = (id: number, status: string) =>
  request.put(`/admin/users/${id}/status`, { status })

// 陪玩审核
export const getProviderApplyList = (params: any) =>
  request.get('/admin/provider/apply', { params })
export const reviewProviderApply = (id: number, data: any) =>
  request.put(`/admin/provider/apply/${id}`, data)

// 订单管理
export const getOrderList = (params: any) => request.get('/admin/orders', { params })
export const getReviewList = (params: any) => request.get('/admin/orders/review', { params })
export const approveReport = (id: number, comment?: string) =>
  request.put(`/admin/orders/${id}/approve`, { comment })
export const rejectReport = (id: number, comment: string) =>
  request.put(`/admin/orders/${id}/reject`, { comment })

// 财务管理
export const manualRecharge = (data: any) => request.post('/admin/wallet/recharge', data)
export const getWithdrawList = (params: any) => request.get('/admin/withdraw/list', { params })
export const reviewWithdraw = (id: number, data: any) =>
  request.put(`/admin/withdraw/${id}`, data)

// 游戏管理
export const createGame = (data: any) => request.post('/admin/game', data)
export const updateGame = (id: number, data: any) => request.put(`/admin/game/${id}`, data)
export const createServiceItem = (data: any) => request.post('/admin/service-item', data)
export const updateServiceItem = (id: number, data: any) =>
  request.put(`/admin/service-item/${id}`, data)

// 游戏列表（公开）
export const getGameList = () => request.get('/game/list')
