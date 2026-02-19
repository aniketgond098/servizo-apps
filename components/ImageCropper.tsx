import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { X, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react';

function getCroppedImg(imageSrc: string, pixelCrop: Area, rotation = 0): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.setAttribute('crossOrigin', 'anonymous');
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject('No canvas context'); return; }

      const rotRad = (rotation * Math.PI) / 180;
      const cos = Math.abs(Math.cos(rotRad));
      const sin = Math.abs(Math.sin(rotRad));
      const bW = image.width * cos + image.height * sin;
      const bH = image.width * sin + image.height * cos;

      canvas.width = bW;
      canvas.height = bH;
      ctx.translate(bW / 2, bH / 2);
      ctx.rotate(rotRad);
      ctx.translate(-image.width / 2, -image.height / 2);
      ctx.drawImage(image, 0, 0);

      const data = ctx.getImageData(pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height);
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      ctx.putImageData(data, 0, 0);

      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}

interface ImageCropperProps {
  imageSrc: string;
  onCropDone: (croppedDataUrl: string) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageSrc, onCropDone, onCancel }: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    try {
      const result = await getCroppedImg(imageSrc, croppedAreaPixels, rotation);
      onCropDone(result);
    } catch (e) {
      console.error('Crop failed', e);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h3 className="text-sm font-bold text-[#000000]">Crop Photo</h3>
          <button onClick={onCancel} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="relative w-full" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onCropComplete={onCropComplete}
            onZoomChange={setZoom}
          />
        </div>

        <div className="px-5 py-3 space-y-3 border-t border-gray-100">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={e => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 accent-[#4169E1] cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </div>

          {/* Rotate */}
          <div className="flex items-center gap-3">
            <RotateCw className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <input
              type="range" min={0} max={360} step={1} value={rotation}
              onChange={e => setRotation(Number(e.target.value))}
              className="flex-1 h-1.5 accent-[#4169E1] cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-8 text-right">{rotation}°</span>
          </div>
        </div>

        <div className="flex gap-3 px-5 py-4 border-t border-gray-100">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 bg-[#000000] text-white rounded-lg text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#1a1a1a] transition-colors">
            <Check className="w-4 h-4" />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
