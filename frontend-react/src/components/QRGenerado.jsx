import { QRCodeSVG } from 'qrcode.react';
import { Download, Share2 } from 'lucide-react';

const QRGenerado = ({ url, id }) => {
  const downloadQR = () => {
    const canvas = document.createElement("canvas");
    const svg = document.getElementById(id);
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      const ctx = canvas.getContext("2d");
      
      // Draw white background
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.drawImage(img, 0, 0);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `ALERTA-QR-${id}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="bg-white p-3 rounded-xl border-2 border-brand-700 shadow-md transform hover:scale-105 transition-transform">
        <QRCodeSVG 
          id={id}
          value={url} 
          size={200}
          level={"H"}
          bgColor={"#ffffff"}
          fgColor={"#000000"}
          includeMargin={false}
          imageSettings={{
            src: "/icons.svg",
            x: undefined,
            y: undefined,
            height: 40,
            width: 40,
            excavate: true,
          }}
        />
      </div>
      
      <div className="flex gap-2 w-full">
        <button 
          onClick={downloadQR}
          className="flex-1 flex justify-center items-center py-2 px-4 bg-brand-700 hover:bg-brand-600 text-white text-sm font-medium rounded-lg shadow transition-colors"
        >
          <Download className="mr-2 h-4 w-4" />
          Descargar QR
        </button>
      </div>
    </div>
  );
};

export default QRGenerado;
