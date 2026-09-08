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
export const deleteGame = (id: number) => request.delete(`/admin/game/${id}`)
export const createServiceItem = (data: any) => request.post('/admin/service-item', data)
export const updateServiceItem = (id: number, data: any) =>
  request.put(`/admin/service-item/${id}`, data)
export const deleteServiceItem = (id: number) => request.delete(`/admin/service-item/${id}`)

// 游戏列表（公开）
export const getGameList = () => request.get('/game/list')

// ==================== 系统配置 ====================
export const getSystemConfig = () => request.get('/system-config')
export const updateSystemConfig = (items: Array<{ key: string; value: string }>) =>
  request.put('/system-config', { items })

// ==================== 商品管理 ====================
export const getProductList = (params: any) => request.get('/product', { params })
export const createProduct = (data: any) => request.post('/product', data)
export const updateProduct = (id: number, data: any) => request.put(`/product/${id}`, data)
export const deleteProduct = (id: number) => request.delete(`/product/${id}`)
export const toggleProduct = (id: number, isActive: boolean) =>
  request.put(`/product/${id}/toggle`, { isActive })

// ==================== 活动管理 ====================
export const getActivityList = (params: any) => request.get('/activity', { params })
export const createActivity = (data: any) => request.post('/activity', data)
export const updateActivity = (id: number, data: any) => request.put(`/activity/${id}`, data)
export const deleteActivity = (id: number) => request.delete(`/activity/${id}`)
export const toggleActivity = (id: number, isActive: boolean) =>
  request.put(`/activity/${id}/toggle`, { isActive })

// ==================== 陪玩管理 ====================
export const getProviderAdminList = (params: any) => request.get('/provider/admin/list', { params })
export const adminUpdateProvider = (id: number, data: any) => request.put(`/provider/admin/${id}`, data)
export const updateProviderRank = (id: number, rank: string) =>
  request.put(`/provider/admin/${id}/rank`, { rank })
export const banProvider = (id: number, banned: boolean) =>
  request.put(`/provider/admin/${id}/ban`, { banned })
export const deleteProvider = (id: number) => request.delete(`/provider/admin/${id}`)
export const getProviderGames = (id: number) => request.get(`/provider/admin/${id}/games`)
export const setProviderGames = (id: number, gameIds: number[]) =>
  request.put(`/provider/admin/${id}/games`, { gameIds })

// ==================== 定价管理 ====================
export const getAllPricings = () => request.get('/pricing/list')
export const batchSavePricings = (items: any[]) => request.post('/pricing/batch', { items })

// ==================== 上传 ====================
export const uploadImage = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post('/upload/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
