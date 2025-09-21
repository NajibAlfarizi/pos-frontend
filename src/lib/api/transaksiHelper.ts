/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
const API_URL = process.env.NEXT_PUBLIC_API_URL;
// const API_URL = "http://localhost:5000";

export const getTransaksi = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const getRingkasanTransaksi = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/ringkasan`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const getLaporanTransaksi = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/laporan`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const exportTransaksiCSV = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/export/csv`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
      responseType: "blob"
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const exportTransaksiExcel = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/export/excel`, {
      headers: { Authorization: `Bearer ${token}` },
      params,
      responseType: "blob"
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const getDetailTransaksi = async (token: string, id: string) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};


export const getAllTransaksi = async (token: string) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const addTransaksi = async (token: string, data: any) => {
  try {
    const res = await axios.post(`${API_URL}/transaksi`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const updateTransaksi = async (token: string, id: string, data: any) => {
  try {
    const res = await axios.put(`${API_URL}/transaksi/${id}`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const deleteTransaksi = async (token: string, id: string) => {
  try {
    const res = await axios.delete(`${API_URL}/transaksi/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
};

export const cetakStrukTransaksi = async (token: string, id: string) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/${id}/struk-pdf`, {
      headers: { Authorization: `Bearer ${token}` },
      responseType: "blob"
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
}

export const getStrukHTML = async (token: string, id: string) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/${id}/struk-html`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
}

export const getStatistikTransaksi = async (token: string, params?: any) => {
  try {
    const res = await axios.get(`${API_URL}/transaksi/statistik`, {
      headers: { Authorization: `Bearer ${token}` },
      params
    });
    return res.data;
  } catch (err: any) {
    if (err.response?.status === 401) {
      window.location.href = '/login';
    }
    throw err;
  }
}