import React from 'react';
import { X } from 'lucide-react';
import { useMediaUploaderContext } from './context.ts';

export const MediaUploaderPreview: React.FC = () => {
  const { preview, handleRemoveFile } = useMediaUploaderContext();

  if (!preview.length) {
    return null;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
      {preview.map((file, index) => (
        <div key={index} className="relative group aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-white/10">
          {file.type.startsWith('image/') ? (
            <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
          ) : (
            <video src={file.preview} controls className="w-full h-full object-cover" />
          )}
          <button
            onClick={() => handleRemoveFile(index)}
            className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {file.name}
          </div>
        </div>
      ))}
    </div>
  );
};
