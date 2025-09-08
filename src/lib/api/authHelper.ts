/* eslint-disable @typescript-eslint/no-explicit-any */
// src/lib/api/authHelper.ts
// Helper untuk autentikasi (login, register, get profile, dll)
// Menyesuaikan endpoint di server: /auth/login, /auth/register, /auth/profile

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Login user (owner/kasir)
export async function login(email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/login`, { email, password });
  // Response: { user, access_token, refresh_token }
  return res.data;
}

// Register admin/kasir (owner only)
export async function addAdmin(name: string, email: string, password: string) {
  const res = await axios.post(`${API_URL}/auth/register`, { name, email, password, role: 'admin' });
  // Response: { message, userId }
  return res.data;
}

// Get user profile (langsung dari localStorage, tidak request ke backend)
export function getProfile() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) throw new Error('Token tidak valid');
  return JSON.parse(userStr);
}

// Logout user
export async function logout(token: string) {
  const res = await axios.post(`${API_URL}/auth/logout`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

// Refresh access token
export async function refreshAccessToken(refresh_token: string) {
  const res = await axios.post(`${API_URL}/auth/refresh`, { refresh_token });
  // Response: { user, access_token, refresh_token }
  return res.data;
}
// Handler API dengan refresh token otomatis
export async function apiWithRefresh(
  apiFn: (token: string) => Promise<any>,
  token: string,
  setToken: (t: string) => void,
  setProfile: (p: any) => void,
  router: any
) {
  try {
    return await apiFn(token);
  } catch (err: any) {
    // Cek jika error 401 (token expired)
    if (err?.response?.status === 401) {
      try {
        const user = getProfile();
        const refreshed = await refreshAccessToken(user.refresh_token);
        if (refreshed?.access_token) {
          const newUser = { ...user, ...refreshed };
          localStorage.setItem("user", JSON.stringify(newUser));
          setProfile(newUser);
          setToken(refreshed.access_token);
          return await apiFn(refreshed.access_token);
        } else {
          localStorage.clear();
          router.replace("/login");
        }
      } catch {
        localStorage.clear();
        router.replace("/login");
      }
    } else {
      throw err;
  }
}
}

// Change password
export async function changePassword(user_id: string, email: string, old_password: string, new_password: string) {
  const res = await axios.post(`${API_URL}/auth/change-password`, {
    user_id,
    email,
    old_password,
    new_password
  });
  return res.data;
}
