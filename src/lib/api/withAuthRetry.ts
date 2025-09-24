/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fungsi untuk refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    // Ambil refresh token dari localStorage
    let refreshTokenValue = localStorage.getItem('refresh_token');
    
    if (!refreshTokenValue) {
      // Jika tidak ada di refresh_token, coba ambil dari object user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          refreshTokenValue = user?.refresh_token;
        } catch (e) {
          console.error('Error parsing user for refresh token:', e);
        }
      }
    }
    
    if (!refreshTokenValue) {
      console.log('Refresh token tidak ditemukan');
      return null;
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshTokenValue
    });

    if (response.data && response.data.access_token) {
      // Simpan token baru di kedua tempat untuk kompatibilitas
      localStorage.setItem('access_token', response.data.access_token);
      
      // Update di object user juga
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          user.access_token = response.data.access_token;
          if (response.data.refresh_token) {
            user.refresh_token = response.data.refresh_token;
          }
          localStorage.setItem('user', JSON.stringify(user));
        } catch (e) {
          console.error('Error updating user object:', e);
        }
      }
      
      // Update refresh token jika ada yang baru
      if (response.data.refresh_token) {
        localStorage.setItem('refresh_token', response.data.refresh_token);
      }
      
      return response.data.access_token;
    }
    
    return null;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
};

// Wrapper untuk API call dengan auto retry menggunakan refresh token
export const withAuthRetry = async <T>(
  apiCall: (token: string) => Promise<T>
): Promise<T> => {
  try {
    // Ambil token dari struktur yang benar (dari object user)
    let token = localStorage.getItem('access_token');
    
    if (!token) {
      // Jika tidak ada di access_token, coba ambil dari object user
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          token = user?.access_token || user?.token;
        } catch (e) {
          console.error('Error parsing user from localStorage:', e);
        }
      }
    }
    
    if (!token) {
      throw new Error('Token tidak ditemukan');
    }
    
    return await apiCall(token);
  } catch (error: any) {
    // Hanya coba refresh jika error 401 (unauthorized)
    if (error.response?.status === 401) {
      console.log('Token expired, mencoba refresh...');
      
      const newToken = await refreshToken();
      if (newToken) {
        console.log('Token berhasil di-refresh, retry API call...');
        return await apiCall(newToken);
      } else {
        // Jika refresh gagal, hapus data user dan redirect ke login
        console.log('Refresh token gagal, logout user...');
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        
        // Redirect ke login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        
        throw new Error('Session expired, please login again');
      }
    }
    
    // Jika bukan error auth, lempar error asli
    throw error;
  }
};
