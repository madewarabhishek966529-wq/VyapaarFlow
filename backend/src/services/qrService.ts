import QRCode from 'qrcode';

export interface IUpiPaymentDetails {
  upiId: string;
  payeeName: string;
  amount: number;
  transactionNote?: string;
  transactionRef?: string;
}

export class QrService {
  /**
   * Generates standard NPCI UPI payment deep link URI:
   * upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
   */
  static generateUpiUri(details: IUpiPaymentDetails): string {
    const params = new URLSearchParams();
    params.set('pa', details.upiId.trim());
    params.set('pn', details.payeeName.trim());
    params.set('am', details.amount.toFixed(2));
    params.set('cu', 'INR');
    if (details.transactionNote) {
      params.set('tn', details.transactionNote.trim());
    }
    if (details.transactionRef) {
      params.set('tr', details.transactionRef.trim());
    }
    return `upi://pay?${params.toString()}`;
  }

  /**
   * Generates Base64 Data URL for QR Code image
   */
  static async generateQrDataUrl(data: string): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 300,
        color: {
          dark: '#14213D',
          light: '#FFFFFF'
        }
      });
    } catch (err: any) {
      console.error('[QR Service] Failed to generate QR code data URL:', err);
      throw new Error('QR code generation failed');
    }
  }
}
