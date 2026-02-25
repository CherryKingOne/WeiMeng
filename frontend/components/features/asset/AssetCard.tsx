'use client';

import { Asset } from '@/types';

interface AssetCardProps {
  asset: Asset;
  onClick?: () => void;
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-gray-200 transition-all cursor-pointer group"
    >
      <div
        className="aspect-square flex items-center justify-center"
        style={{ background: asset.imageGradient }}
      >
        {asset.imageUrl ? (
          <img src={asset.imageUrl} alt={asset.title} className="w-full h-full object-cover" />
        ) : (
          <svg className="w-12 h-12 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )}
      </div>

      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-black transition-colors truncate">
          {asset.title}
        </h3>
        <p className="text-xs text-gray-500 truncate">{asset.creator}</p>
      </div>
    </div>
  );
}
