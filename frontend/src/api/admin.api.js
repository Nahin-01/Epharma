import { apiClient, unwrap, unwrapFull } from '../lib/apiClient';

// Every method here hits a real backend endpoint gated by a specific
// permission (see backend/src/constants/permissions.js) — the server is
// the source of truth for access control; the admin UI only reflects it.
export const reportsApi = {
  dashboard: () => unwrap(apiClient.get('/reports/dashboard')),
  sales: (params) => unwrap(apiClient.get('/reports/sales', { params })),
  inventory: () => unwrap(apiClient.get('/reports/inventory')),
  prescriptions: (params) => unwrap(apiClient.get('/reports/prescriptions', { params })),
  delivery: (params) => unwrap(apiClient.get('/reports/delivery', { params })),
};

export const inventoryApi = {
  listBatches: (params) => unwrapFull(apiClient.get('/inventory/batches', { params })),
  getBatch: (id) => unwrap(apiClient.get(`/inventory/batches/${id}`)),
  createBatch: (payload) => unwrap(apiClient.post('/inventory/batches', payload)),
  updateBatch: (id, payload) => unwrap(apiClient.patch(`/inventory/batches/${id}`, payload)),
};

export const warehousesApi = {
  list: (params) => unwrapFull(apiClient.get('/warehouses', { params })),
  create: (payload) => unwrap(apiClient.post('/warehouses', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/warehouses/${id}`, payload)),
  remove: (id) => unwrap(apiClient.delete(`/warehouses/${id}`)),
};

export const suppliersApi = {
  list: (params) => unwrapFull(apiClient.get('/suppliers', { params })),
  create: (payload) => unwrap(apiClient.post('/suppliers', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/suppliers/${id}`, payload)),
  remove: (id) => unwrap(apiClient.delete(`/suppliers/${id}`)),
};

export const staffApi = {
  list: (params) => unwrapFull(apiClient.get('/users', { params })),
  getById: (id) => unwrap(apiClient.get(`/users/${id}`)),
  create: (payload) => unwrap(apiClient.post('/users', payload)),
  update: (id, payload) => unwrap(apiClient.patch(`/users/${id}`, payload)),
  deactivate: (id) => unwrap(apiClient.delete(`/users/${id}`)),
};

export const auditApi = {
  list: (params) => unwrapFull(apiClient.get('/admin/audit-logs', { params })),
  roles: () => unwrap(apiClient.get('/admin/roles')),
  permissions: () => unwrap(apiClient.get('/admin/permissions')),
};
