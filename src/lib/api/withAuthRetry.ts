/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// Fungsi untuk refresh token
export const refreshToken = async (): Promise<string | null> => {
  try {
    const refreshTokenValue = localStorage.getItem('refresh_token');
    if (!refreshTokenValue) {
      console.log('Refresh token tidak ditemukan');
      return null;
    }

    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshTokenValue
    });

    if (response.data && response.data.access_token) {
      // Simpan token baru
      localStorage.setItem('access_token', response.data.access_token);
      
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
    const token = localStorage.getItem('access_token');
    
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
      }
    }
    
    // Jika bukan error auth atau refresh gagal, lempar error asli
    throw error;
  }
};
