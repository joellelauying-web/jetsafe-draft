import { QRCodeSVG } from 'qrcode.react';
import { Share2, Download } from 'lucide-react';

export default function QRCodeDisplay() {
  const appUrl = window.location.origin;

  const downloadQR = () => {
    const svg = document.getElementById('app-qr-code');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'jetsafe-ai-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <div className="bg-white rounded-3xl p-8 border border-stone-200 shadow-sm flex flex-col items-center text-center">
      <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
        <Share2 className="text-indigo-600 w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-stone-900 mb-2">Share JETSafe AI</h3>
      <p className="text-stone-500 text-sm mb-6 max-w-xs">
        Invite friends and family to stay safe. Scan this code to open the app on any phone.
      </p>
      
      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-100 mb-6">
        <QRCodeSVG 
          id="app-qr-code"
          value={appUrl} 
          size={160}
          level="H"
          includeMargin={true}
          className="rounded-lg"
        />
      </div>

      <button 
        onClick={downloadQR}
        className="flex items-center gap-2 px-6 py-3 bg-stone-100 text-stone-700 rounded-2xl hover:bg-stone-200 transition-colors font-semibold text-sm"
      >
        <Download className="w-4 h-4" />
        Download QR Code
      </button>
    </div>
  );
}
