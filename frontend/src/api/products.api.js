import { apiClient, unwrap, unwrapFull } from '../lib/apiClient';

export const productsApi = {
  list: (params) => unwrapFull(apiClient.get('/products', { params })),
  getBySlug: (slug) => unwrap(apiClient.get(`/products/slug/${encodeURIComponent(slug)}`)),
  getById: (id) => unwrap(apiClient.get(`/products/${id}`)),
  getRelated: (id, limit = 8) => unwrap(apiClient.get(`/products/${id}/related`, { params: { limit } })),
  // Admin/staff mutations — server enforces PRODUCT_CREATE/UPDATE/DELETE permission.
  create: (payload) => unwrap(apiClient.post('/products', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/products/${id}`, payload)),
  remove: (id) => unwrap(apiClient.delete(`/products/${id}`)),
};

export const categoriesApi = {
  tree: (activeOnly = true) => unwrap(apiClient.get('/categories/tree', { params: { activeOnly } })),
  list: () => unwrapFull(apiClient.get('/categories')),
  getById: (id) => unwrap(apiClient.get(`/categories/${id}`)),
  create: (payload) => unwrap(apiClient.post('/categories', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/categories/${id}`, payload)),
  remove: (id) => unwrap(apiClient.delete(`/categories/${id}`)),
};

export const brandsApi = {
  list: (params) => unwrapFull(apiClient.get('/brands', { params })),
};

export const genericsApi = {
  list: (params) => unwrapFull(apiClient.get('/generics', { params })),
};
