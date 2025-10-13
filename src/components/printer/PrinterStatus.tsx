import React from 'react';
import { Printer, Wifi, WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { usePrinter } from '@/hooks/usePrinter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export const PrinterStatus: React.FC = () => {
  const { printerStatus, isLoading, checkPrinterStatus, printTest } = usePrinter();

  const getStatusColor = () => {
    switch (printerStatus.status) {
      case 'ready':
        return 'bg-green-500';
      case 'not_connected':
        return 'bg-red-500';
      case 'error':
        return 'bg-yellow-500';
      case 'checking':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (printerStatus.status) {
      case 'ready':
        return <Wifi className="w-4 h-4" />;
      case 'not_connected':
        return <WifiOff className="w-4 h-4" />;
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'checking':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <Printer className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (printerStatus.status) {
      case 'ready':
        return 'Siap';
      case 'not_connected':
        return 'Tidak Terhubung';
      case 'error':
        return 'Error';
      case 'checking':
        return 'Mengecek...';
      default:
        return 'Unknown';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 backdrop-blur hover:bg-white/20 transition-all border border-white/20"
          title="Status Printer"
        >
          <div className="relative">
            <Printer className="w-5 h-5 text-white" />
            <div
              className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${getStatusColor()} border-2 border-white`}
            />
          </div>
          <span className="text-white text-sm font-medium hidden md:block">
            {getStatusText()}
          </span>
        </button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Status Printer Thermal
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Status Display */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getStatusIcon()}
              <div>
                <p className="font-medium">{getStatusText()}</p>
                <p className="text-sm text-gray-500">
                  {printerStatus.lastChecked
                    ? `Terakhir dicek: ${printerStatus.lastChecked.toLocaleTimeString('id-ID')}`
                    : 'Belum pernah dicek'}
                </p>
              </div>
            </div>
            <Badge
              variant={printerStatus.isConnected ? 'default' : 'destructive'}
              className={printerStatus.isConnected ? 'bg-green-500' : ''}
            >
              {printerStatus.isConnected ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={checkPrinterStatus}
              disabled={isLoading}
              variant="outline"
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Mengecek...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Status
                </>
              )}
            </Button>
            
            <Button
              onClick={printTest}
              disabled={isLoading || !printerStatus.isConnected}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Mencetak...
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 mr-2" />
                  Test Print
                </>
              )}
            </Button>
          </div>

          {/* Help Text */}
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Pastikan printer thermal terhubung via USB</p>
            <p>• Status akan diperbarui otomatis setiap 30 detik</p>
            <p>• Gunakan &quot;Test Print&quot; untuk mengecek koneksi</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};