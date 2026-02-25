export type AssetType = 'image' | '3d' | 'video' | 'favorite';

export interface AssetParams {
  model: string;
  seed: string;
  steps: string;
  cfgScale: string;
}

export interface Asset {
  id: string;
  type: AssetType;
  title: string;
  creator: string;
  date: string;
  prompt: string;
  imageGradient: string;
  imageUrl?: string;
  params: AssetParams;
  isFavorite?: boolean;
}

export interface AssetFilter {
  type: AssetType | 'all';
  search: string;
  sortBy: 'date' | 'name';
}
