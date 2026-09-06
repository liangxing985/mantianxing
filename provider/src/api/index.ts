import request from '@/utils/request'

export const register = (data: any) => request.post('/auth/register/provider', data)
export const login = (data: any) => request.post('/auth/login', data)
export const getProfile = () => request.get('/auth/profile')
export const updateProfile = (data: any) => request.put('/user/profile', data)

// 陪玩资料
export const getMyProfile = () => request.get('/provider/my-profile')
export const updateMyProfile = (data: any) => request.put('/provider/profile', data)
export const toggleOnline = (online: boolean) => request.put('/provider/online', { isOnline: online })
export const toggleAcceptOrder = (accept: boolean) => request.put('/provider/accept-order', { acceptOrder: accept })

// 服务定价
export const getMyServices = () => request.get('/provider/my-services')
export const updateServicePrice = (id: number, price: number) =>
  request.put(`/provider/service/${id}/price`, { price })
export const toggleService = (id: number, enabled: boolean) =>
  request.put(`/provider/service/${id}/toggle`, { isEnabled: enabled })

// 抢单
export const getOrderPool = (params: any) => request.get('/order/pool', { params })
export const grabOrder = (id: number) => request.post(`/order/${id}/grab`)

// 订单
export const getMyOrders = (params: any) => request.get('/order/my', { params })
export const getOrderDetail = (id: number) => request.get(`/order/${id}`)
export const startOrder = (id: number) => request.put(`/order/${id}/start`)
export const submitReport = (id: number, data: any) => request.post(`/order/${id}/report`, data)

// 钱包
export const getWallet = () => request.get('/wallet/balance')
export const getTransactions = (params: any) => request.get('/wallet/transactions', { params })
export const createWithdraw = (data: any) => request.post('/wallet/withdraw', data)

// 消息
export const getMessages = (params: any) => request.get('/message/list', { params })
