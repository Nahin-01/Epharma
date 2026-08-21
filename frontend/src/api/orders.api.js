import { apiClient, unwrap, unwrapFull } from '../lib/apiClient';

export const ordersApi = {
  checkout: (payload) => unwrap(apiClient.post('/orders/checkout', payload)),
  listMine: (params) => unwrapFull(apiClient.get('/orders/mine', { params })),
  getById: (id) => unwrap(apiClient.get(`/orders/${id}`)),
  cancel: (id, reason = '') => unwrap(apiClient.post(`/orders/${id}/cancel`, { reason })),
  // Admin/staff — requires ORDER_VIEW / ORDER_UPDATE permission server-side.
  listAll: (params) => unwrapFull(apiClient.get('/orders', { params })),
  updateStatus: (id, status, note = '') => unwrap(apiClient.patch(`/orders/${id}/status`, { status, note })),
};

export const deliveryApi = {
  resolveCharge: (district, area) => unwrap(apiClient.get('/delivery/zones/charge', { params: { district, area } })),
  getByOrder: (orderId) => unwrap(apiClient.get(`/delivery/order/${orderId}`)),
  // Admin/staff — requires DELIVERY_MANAGE permission server-side.
  listAll: (params) => unwrapFull(apiClient.get('/delivery', { params })),
  syncTracking: (orderId) => unwrap(apiClient.post(`/delivery/order/${orderId}/sync`)),
  listZones: () => unwrapFull(apiClient.get('/delivery/zones')),
  createZone: (payload) => unwrap(apiClient.post('/delivery/zones', payload)),
  updateZone: (id, payload) => unwrap(apiClient.patch(`/delivery/zones/${id}`, payload)),
  removeZone: (id) => unwrap(apiClient.delete(`/delivery/zones/${id}`)),
};

export const couponsApi = {
  preview: (code, subtotal) => unwrap(apiClient.post('/coupons/preview', { code, subtotal })),
  // Admin/staff — requires COUPON_MANAGE permission server-side.
  list: (params) => unwrapFull(apiClient.get('/coupons', { params })),
  getById: (id) => unwrap(apiClient.get(`/coupons/${id}`)),
  create: (payload) => unwrap(apiClient.post('/coupons', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/coupons/${id}`, payload)),
  remove: (id) => unwrap(apiClient.delete(`/coupons/${id}`)),
};

export const paymentsApi = {
  getByOrder: (orderId) => unwrap(apiClient.get(`/payments/order/${orderId}`)),
  mockCompleteUrl: (transactionId) => `${apiClient.defaults.baseURL}/payments/mock/${transactionId}/complete`,
};
