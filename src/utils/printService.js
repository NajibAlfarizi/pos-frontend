const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export class PrintService {
  // Print struk transaksi
  static async printStruk(id_transaksi) {
    try {
      const response = await fetch(`${API_BASE}/print/struk/${id_transaksi}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();
      return result;
    } catch (error) {
      throw new Error(`Print error: ${error.message}`);
    }
  }

  // Test printer connection
  static async testPrinter() {
    try {
      const response = await fetch(`${API_BASE}/print/test`, {
        method: 'POST',
      });
      return await response.json();
    } catch (error) {
      throw new Error(`Test error: ${error.message}`);
    }
  }

  // Get printer status
  static async getPrinterStatus() {
    try {
      const response = await fetch(`${API_BASE}/print/status`);
      return await response.json();
    } catch (error) {
      throw new Error(`Status error: ${error.message}`);
    }
  }
}