'use client'
import { useState, useEffect } from 'react';
import { PrintService } from '../utils/printService';

export function usePrinterStatus() {
  const [status, setStatus] = useState({
    connected: false,
    loading: true,
    error: null
  });

  const checkStatus = async () => {
    try {
      setStatus(prev => ({ ...prev, loading: true }));
      const result = await PrintService.getPrinterStatus();
      
      setStatus({
        connected: result.connected,
        loading: false,
        error: result.success ? null : result.error,
        config: result.config
      });
    } catch (error) {
      setStatus({
        connected: false,
        loading: false,
        error: error.message
      });
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return { status, checkStatus };
}