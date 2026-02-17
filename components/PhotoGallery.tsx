import React, { useState } from 'react';
import { Camera, X, Upload, Image as ImageIcon, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
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
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'before' | 'after' | 'problem'>('all');
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file: File) => DB.uploadPhoto(file));
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const allPhotos = [
    ...problemPhotos.map(p => ({ url: p, type: 'Problem' as const })),
    ...beforePhotos.map(p => ({ url: p, type: 'Before' as const })),
    ...afterPhotos.map(p => ({ url: p, type: 'After' as const }))
  ];

  const filteredPhotos = activeTab === 'all' ? allPhotos : allPhotos.filter(p => p.type.toLowerCase() === activeTab);

  const tabCounts = {
    all: allPhotos.length,
    before: beforePhotos.length,
    after: afterPhotos.length,
    problem: problemPhotos.length,
  };

  const typeColors = {
    Problem: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', dot: 'bg-red-400' },
    Before: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', dot: 'bg-amber-400' },
    After: { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', dot: 'bg-green-400' },
  };

  if (allPhotos.length === 0 && !canUpload) return null;

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#1a73e8]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1a2b49]">Photo Evidence</h3>
              <p className="text-xs text-gray-400">{allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''} uploaded</p>
            </div>
          </div>
          {canUpload && (
            <label className={`px-4 py-2.5 bg-[#1a2b49] text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-[#0f1d35] transition-colors flex items-center gap-2 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
              <Upload className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Upload Photos'}
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {/* Tabs */}
        {allPhotos.length > 0 && (
          <div className="flex gap-2">
            {(['all', 'problem', 'before', 'after'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activeTab === tab
                    ? 'bg-[#1a2b49] text-white'
                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab ? 'bg-white/20' : 'bg-gray-200/80'
                }`}>
                  {tabCounts[tab]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Photo Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredPhotos.map((photo, idx) => {
              const colors = typeColors[photo.type];
              return (
                <div
                  key={idx}
                  className="relative group cursor-pointer rounded-xl overflow-hidden border border-gray-100 hover:border-[#1a73e8]/30 hover:shadow-md transition-all"
                  onClick={() => setSelectedIndex(idx)}
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={photo.url}
                      alt={`${photo.type} photo`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                        <ZoomIn className="w-5 h-5 text-[#1a2b49]" />
                      </div>
                    </div>
                  </div>
                  {/* Type Badge */}
                  <div className={`absolute top-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colors.bg} ${colors.border} border backdrop-blur-sm`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`}></div>
                    <span className={`text-[10px] font-semibold ${colors.text}`}>{photo.type}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : canUpload ? (
        <div
          className={`mx-6 mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragOver ? 'border-[#1a73e8] bg-blue-50/50' : 'border-gray-200 bg-gray-50/50'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ImageIcon className="w-7 h-7 text-gray-300" />
          </div>
          <p className="text-sm font-medium text-gray-500 mb-1">No photos yet</p>
          <p className="text-xs text-gray-400">Drag & drop images here or use the upload button above</p>
        </div>
      ) : (
        <div className="px-6 pb-6">
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-7 h-7 text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-500">No photos uploaded yet</p>
          </div>
        </div>
      )}

      {/* Lightbox Modal */}
      {selectedIndex !== null && filteredPhotos[selectedIndex] && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setSelectedIndex(null)}>
          {/* Close */}
          <button className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/10 rounded-full">
            <span className="text-xs text-white/80 font-medium">{selectedIndex + 1} / {filteredPhotos.length}</span>
          </div>

          {/* Nav arrows */}
          {filteredPhotos.length > 1 && (
            <>
              <button
                className="absolute left-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev !== null ? (prev - 1 + filteredPhotos.length) % filteredPhotos.length : 0); }}
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              <button
                className="absolute right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10"
                onClick={(e) => { e.stopPropagation(); setSelectedIndex(prev => prev !== null ? (prev + 1) % filteredPhotos.length : 0); }}
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          {/* Image */}
          <div className="max-w-4xl max-h-[80vh] px-16" onClick={(e) => e.stopPropagation()}>
            <img
              src={filteredPhotos[selectedIndex].url}
              alt="Full size"
              className="max-w-full max-h-[80vh] rounded-lg object-contain"
            />
            {/* Type badge below image */}
            <div className="flex justify-center mt-4">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${typeColors[filteredPhotos[selectedIndex].type].bg} ${typeColors[filteredPhotos[selectedIndex].type].border} border`}>
                <div className={`w-1.5 h-1.5 rounded-full ${typeColors[filteredPhotos[selectedIndex].type].dot}`}></div>
                <span className={`text-xs font-semibold ${typeColors[filteredPhotos[selectedIndex].type].text}`}>
                  {filteredPhotos[selectedIndex].type} Photo
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
