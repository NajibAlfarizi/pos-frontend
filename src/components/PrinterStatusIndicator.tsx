'use client'
import { usePrinterStatus } from '../hooks/usePrinterStatus';
import { Bluetooth, BluetoothConnected, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';

export default function PrinterStatusIndicator({ showRefresh = true }) {
  const { status, checkStatus } = usePrinterStatus();

  const getStatusColor = () => {
    if (status.loading) return 'text-yellow-500';
    if (status.connected) return 'text-green-500';
    return 'text-red-500';
  };

  const getStatusText = () => {
    if (status.loading) return 'Checking...';
    if (status.connected) return 'Printer Connected';
    return 'Printer Disconnected';
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <div className="flex items-center gap-1">
        {status.loading ? (
          <RefreshCw className="w-4 h-4 animate-spin text-yellow-500" />
        ) : status.connected ? (
          <BluetoothConnected className={`w-4 h-4 ${getStatusColor()}`} />
        ) : (
          <Bluetooth className={`w-4 h-4 ${getStatusColor()}`} />
        )}
        
        <span className={getStatusColor()}>
          {getStatusText()}
        </span>
      </div>

      {showRefresh && (
        <Button
          variant="ghost"
          size="sm"
          onClick={checkStatus}
          disabled={status.loading}
          className="h-6 px-2 py-1"
        >
          <RefreshCw className={`w-3 h-3 ${status.loading ? 'animate-spin' : ''}`} />
        </Button>
      )}

      {status.error && (
        <span className="text-xs text-red-400" title={status.error}>
          ⚠️
        </span>
      )}
    </div>
  );
}