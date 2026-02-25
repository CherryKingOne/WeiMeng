'use client';

import { Asset } from '@/types';
import { AssetCard } from './AssetCard';

interface AssetGridProps {
  assets: Asset[];
  onAssetClick?: (asset: Asset) => void;
}

export function AssetGrid({ assets, onAssetClick }: AssetGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onClick={() => onAssetClick?.(asset)}
        />
      ))}
    </div>
  );
}
