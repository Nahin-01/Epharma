import { apiClient, unwrap } from '../lib/apiClient';

export const usersApi = {
  getMe: () => unwrap(apiClient.get('/users/me')),
};
