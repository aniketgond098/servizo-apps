import React, { useState } from 'react';
import { Camera, X, Upload, Image as ImageIcon } from 'lucide-react';
import { DB } from '../services/db';

interface PhotoGalleryProps {
  bookingId: string;
  beforePhotos?: string[];
  afterPhotos?: string[];
  problemPhotos?: string[];
  canUpload?: boolean;
  uploadType?: 'before' | 'after' | 'problem';
}

export function PhotoGallery({ bookingId, beforePhotos = [], afterPhotos = [], problemPhotos = [], canUpload = false, uploadType }: PhotoGalleryProps) {
  const [uploading, setUploading] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => DB.uploadPhoto(file));
      const photoUrls = await Promise.all(uploadPromises);

      if (uploadType === 'before') {
        await DB.addBeforePhotos(bookingId, photoUrls);
      } else if (uploadType === 'after') {
        await DB.addAfterPhotos(bookingId, photoUrls);
      } else if (uploadType === 'problem') {
        await DB.addProblemPhotos(bookingId, photoUrls);
      }

      window.location.reload();
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const allPhotos = [
    ...problemPhotos.map(p => ({ url: p, type: 'Problem' })),
    ...beforePhotos.map(p => ({ url: p, type: 'Before' })),
    ...afterPhotos.map(p => ({ url: p, type: 'After' }))
  ];

  if (allPhotos.length === 0 && !canUpload) return null;

  return (
    <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-500" />
          <h3 className="text-lg font-black uppercase">Photo Evidence</h3>
        </div>
        {canUpload && (
          <label className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold uppercase cursor-pointer hover:bg-blue-500 transition-all flex items-center gap-2">
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload'}
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={uploading}
            />
          </label>
        )}
      </div>

      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {allPhotos.map((photo, idx) => (
            <div key={idx} className="relative group cursor-pointer" onClick={() => setSelectedPhoto(photo.url)}>
              <img
                src={photo.url}
                alt={`${photo.type} photo`}
                className="w-full h-32 object-cover rounded-lg border border-zinc-800 group-hover:border-blue-500 transition-all"
              />
              <span className="absolute top-2 left-2 px-2 py-1 bg-black/80 text-[10px] font-bold uppercase rounded">
                {photo.type}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No photos uploaded yet</p>
        </div>
      )}

      {/* Photo Viewer Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4" onClick={() => setSelectedPhoto(null)}>
          <button className="absolute top-4 right-4 p-2 bg-zinc-900 rounded-full hover:bg-zinc-800">
            <X className="w-6 h-6" />
          </button>
          <img src={selectedPhoto} alt="Full size" className="max-w-full max-h-full rounded-lg" />
        </div>
      )}
    </div>
  );
}
