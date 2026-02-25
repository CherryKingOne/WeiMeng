export type PluginCategory = '模型训练' | '图像生成' | '工具增强' | '工作流';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  category: PluginCategory;
  rating: number;
  downloads: string;
  installed: boolean;
  active: boolean;
  iconGradient: string;
  iconPath: string;
  version?: string;
  author?: string;
}

export interface PluginConfig {
  pluginId: string;
  settings: Record<string, unknown>;
}

export interface PluginFilter {
  category: PluginCategory | 'all';
  search: string;
  installed: boolean | 'all';
}
