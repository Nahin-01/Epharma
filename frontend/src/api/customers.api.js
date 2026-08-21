import { apiClient, unwrap, unwrapFull } from '../lib/apiClient';

export const customersApi = {
  getMe: () => unwrap(apiClient.get('/customers/me')),
  updateMe: (payload) => unwrap(apiClient.patch('/customers/me', payload)),
  listAddresses: () => unwrap(apiClient.get('/customers/me/addresses')),
  addAddress: (payload) => unwrap(apiClient.post('/customers/me/addresses', payload)),
  updateAddress: (addressId, payload) => unwrap(apiClient.patch(`/customers/me/addresses/${addressId}`, payload)),
  deleteAddress: (addressId) => unwrap(apiClient.delete(`/customers/me/addresses/${addressId}`)),
  // Admin/staff — requires CUSTOMER_VIEW permission server-side.
  list: (params) => unwrapFull(apiClient.get('/customers', { params })),
  getById: (id) => unwrap(apiClient.get(`/customers/${id}`)),
};
