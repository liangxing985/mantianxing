import request from '@/utils/request'

// 认证
export const register = (data: any) => request.post('/auth/register/customer', data)
export const login = (data: any) => request.post('/auth/login', data)
export const getProfile = () => request.get('/auth/profile')
export const updateProfile = (data: any) => request.put('/user/profile', data)

// 游戏
export const getGameList = () => request.get('/game/list')

// 陪玩
export const getProviderList = (params: any) => request.get('/provider/list', { params })
export const getProviderDetail = (id: number) => request.get(`/provider/${id}`)

// 订单
export const createOrder = (data: any) => request.post('/order/create', data)
export const getMyOrders = (params: any) => request.get('/order/my', { params })
export const getOrderDetail = (id: number) => request.get(`/order/${id}`)
export const cancelOrder = (id: number, reason?: string) =>
  request.put(`/order/${id}/cancel`, { reason })
export const reviewOrder = (id: number, data: any) => request.post(`/order/${id}/review`, data)

// 钱包
export const getWallet = () => request.get('/wallet/balance')
export const getTransactions = (params: any) => request.get('/wallet/transactions', { params })
export const createWithdraw = (data: any) => request.post('/wallet/withdraw', data)
export const getWithdrawList = (params: any) => request.get('/wallet/withdraw/list', { params })

// 消息
export const getMessages = (params: any) => request.get('/message/list', { params })
export const readMessage = (id: number) => request.put(`/message/${id}/read`)

// 公开配置（主题、抽成、汇率）
export const getPublicConfig = () => request.get('/system-config/public/theme')

// 商品（公开）
export const getProductList = () => request.get('/product/public/list')

// 活动（公开）
export const getActivityList = () => request.get('/activity/public/list')

// 聊天
export const getConversations = () => request.get('/chat/conversations')
export const getOrCreateConversation = (targetUserId: number) => request.post(`/chat/conversation/${targetUserId}`)
export const getChatMessages = (conversationId: number, params?: any) => request.get(`/chat/messages/${conversationId}`, { params })
export const sendChatMessage = (conversationId: number, data: any) => request.post(`/chat/messages/${conversationId}`, data)

// 排行榜
export const getRank = (type: string) => request.get(`/rank/${type}`)

// 会员
export const getMembershipLevels = () => request.get('/membership/levels')
export const getMyMembership = () => request.get('/membership/my')
export const purchaseMembership = (data: any) => request.post('/membership/purchase', data)

// 邀请
export const getInviteCode = () => request.get('/invite/code')
export const getInviteList = () => request.get('/invite/list')
export const getCommissions = (params?: any) => request.get('/invite/commissions', { params })

// 礼物
export const getGiftList = () => request.get('/gift/list')
export const sendGift = (data: any) => request.post('/gift/send', data)

// 标签
export const getTagList = (category?: string) => request.get('/tag/list', { params: { category } })
export const getUserTags = (userId: number) => request.get(`/tag/user/${userId}`)
