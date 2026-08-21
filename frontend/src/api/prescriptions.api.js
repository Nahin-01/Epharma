import { apiClient, unwrap, unwrapFull } from '../lib/apiClient';

export const prescriptionsApi = {
  upload: (files, source = 'UPLOAD', onProgress) => {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    form.append('source', source);
    return unwrap(
      apiClient.post('/prescriptions', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: onProgress
          ? (evt) => onProgress(evt.total ? Math.round((evt.loaded / evt.total) * 100) : 0)
          : undefined,
      })
    );
  },
  listMine: (params) => unwrapFull(apiClient.get('/prescriptions/mine', { params })),
  getById: (id) => unwrap(apiClient.get(`/prescriptions/${id}`)),
  getSignedFileUrl: (id, fileId) => unwrap(apiClient.get(`/prescriptions/${id}/files/${fileId}/signed-url`)),
  addClarification: (id, note) => unwrap(apiClient.post(`/prescriptions/${id}/clarifications`, { note })),
  // Admin/staff — requires PRESCRIPTION_VIEW / PRESCRIPTION_REVIEW permission server-side.
  listReviewQueue: (params) => unwrapFull(apiClient.get('/prescriptions/review-queue', { params })),
  review: (id, status, notes = '') => unwrap(apiClient.patch(`/prescriptions/${id}/review`, { status, notes })),
};
