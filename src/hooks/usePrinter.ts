import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface PrinterStatus {
  isConnected: boolean;
  status: 'ready' | 'not_connected' | 'error' | 'checking';
  lastChecked: Date | null;
}

export const usePrinter = () => {
  const [printerStatus, setPrinterStatus] = useState<PrinterStatus>({
    isConnected: false,
    status: 'checking',
    lastChecked: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPrintingAuto, setIsPrintingAuto] = useState(false);

  // Base URL untuk API printer (sesuaikan dengan backend Anda)
  const PRINTER_API_BASE = "http://localhost:5000"; // Ganti dengan URL API printer Anda

  const checkPrinterStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${PRINTER_API_BASE}/print/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setPrinterStatus({
          isConnected: true,
          status: 'ready',
          lastChecked: new Date(),
        });
      } else {
        setPrinterStatus({
          isConnected: false,
          status: 'not_connected',
          lastChecked: new Date(),
        });
      }
    } catch (error) {
      console.error('Error checking printer status:', error);
      setPrinterStatus({
        isConnected: false,
        status: 'error',
        lastChecked: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  }, [PRINTER_API_BASE]);

  const printTest = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${PRINTER_API_BASE}/print/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Print test berhasil dikirim ke printer');
        // Update status setelah print test berhasil
        await checkPrinterStatus();
      } else {
        toast.error(`Print test gagal: ${data.error}`);
      }
    } catch (error) {
      console.error('Error sending print test:', error);
      toast.error('Gagal mengirim print test');
    } finally {
      setIsLoading(false);
    }
  }, [PRINTER_API_BASE, checkPrinterStatus]);

  const printStruk = useCallback(async (idTransaksi: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`${PRINTER_API_BASE}/print/struk/${idTransaksi}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        toast.success('Struk berhasil dicetak');
        return true;
      } else {
        toast.error(`Gagal cetak struk: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error printing struk:', error);
      toast.error('Gagal cetak struk');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [PRINTER_API_BASE]);

  const printStrukAuto = useCallback(async (idTransaksi: string, onProgress?: (message: string) => void) => {
    try {
      setIsPrintingAuto(true);
      
      // Callback untuk menampilkan progress
      if (onProgress) {
        onProgress('Mengecek status printer...');
      }

      // Cek status printer terlebih dahulu
      if (!printerStatus.isConnected) {
        await checkPrinterStatus();
      }

      if (!printerStatus.isConnected) {
        toast.error('Printer tidak terhubung. Struk tidak dapat dicetak secara otomatis.');
        return false;
      }

      if (onProgress) {
        onProgress('Mencetak struk...');
      }

      const response = await fetch(`${PRINTER_API_BASE}/print/struk/${idTransaksi}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      
      if (data.success) {
        if (onProgress) {
          onProgress('Struk berhasil dicetak!');
        }
        toast.success('Struk berhasil dicetak secara otomatis');
        return true;
      } else {
        toast.error(`Gagal cetak struk otomatis: ${data.error}`);
        return false;
      }
    } catch (error) {
      console.error('Error auto printing struk:', error);
      toast.error('Gagal cetak struk otomatis');
      return false;
    } finally {
      setIsPrintingAuto(false);
    }
  }, [PRINTER_API_BASE, printerStatus.isConnected, checkPrinterStatus]);

  // Check printer status saat pertama kali load
  useEffect(() => {
    checkPrinterStatus();
  }, [checkPrinterStatus]);

  // Auto refresh status setiap 30 detik jika printer tidak tersambung
  useEffect(() => {
    if (!printerStatus.isConnected && printerStatus.status !== 'checking') {
      const interval = setInterval(() => {
        checkPrinterStatus();
      }, 30000); // 30 detik

      return () => clearInterval(interval);
    }
  }, [printerStatus.isConnected, printerStatus.status, checkPrinterStatus]);

  return {
    printerStatus,
    isLoading,
    isPrintingAuto,
    checkPrinterStatus,
    printTest,
    printStruk,
    printStrukAuto,
  };
};