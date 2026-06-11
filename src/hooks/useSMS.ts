import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import WebApp from '@twa-dev/sdk';

// We pass Telegram ID via headers to backend proxy for auth
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 10000, // 10s timeout to prevent infinite hanging
});

apiClient.interceptors.request.use((config) => {
  // @ts-ignore
  const tgId = WebApp.initDataUnsafe?.user?.id?.toString() || "";
  config.headers['x-telegram-id'] = tgId;
  return config;
});

export const useLatestSMS = () => useQuery({
  queryKey: ['sms', 'latest'],
  queryFn: async () => {
    const response = await apiClient.get('/sms/latest');
    // Handle both { data: ... } and direct data
    const data = response.data?.data !== undefined ? response.data.data : response.data;
    return data || null;
  },
  staleTime: 5000,
  gcTime: 1000 * 60 * 5,
  retry: 3,
  refetchInterval: 5000,
  refetchOnWindowFocus: 'always'
});

export const useAllSMS = () => useQuery({
  queryKey: ['sms', 'all'],
  queryFn: async () => {
    const response = await apiClient.get('/sms');
    const data = response.data?.data !== undefined ? response.data.data : response.data;
    return Array.isArray(data) ? data : [];
  },
  staleTime: 10000,
  gcTime: 1000 * 60 * 10,
  retry: 3,
  refetchInterval: 10000,
  refetchOnWindowFocus: 'always'
});

export const useUser = () => useQuery({
  queryKey: ['user', 'me'],
  queryFn: () => apiClient.get('/user/me').then(r => r.data),
  retry: false
});

export const useAdminUsers = () => useQuery({
  queryKey: ['admin', 'users'],
  queryFn: () => apiClient.get('/admin/users').then(r => r.data)
});

export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ telegramId, status }: { telegramId: string, status: string }) => 
      apiClient.post(`/admin/users/${telegramId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    }
  });
};
