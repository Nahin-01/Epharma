import { apiClient, unwrap } from '../lib/apiClient';

export const cartApi = {
  get: () => unwrap(apiClient.get('/cart')),
  addItem: (product, quantity = 1) => unwrap(apiClient.post('/cart/items', { product, quantity })),
  updateItem: (productId, quantity) => unwrap(apiClient.patch(`/cart/items/${productId}`, { quantity })),
  removeItem: (productId) => unwrap(apiClient.delete(`/cart/items/${productId}`)),
  clear: () => unwrap(apiClient.delete('/cart')),
  applyCoupon: (code) => unwrap(apiClient.post('/cart/coupon', { code })),
  setNotes: (notes) => unwrap(apiClient.patch('/cart/notes', { notes })),
};
