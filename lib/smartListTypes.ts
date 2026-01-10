export type SmartListProvenance = {
  id: string;
  sourceText: string;
  sourceRecipeId?: string | null;
  sourceCount?: number | null;
  notes?: string | null;
};

export type SmartListItem = {
  id: string;
  category: string;
  displayText: string;
  quantityValue?: number | null;
  quantityUnit?: string | null;
  isEstimated: boolean;
  isMerged: boolean;
  sortKey: number;
  provenance: SmartListProvenance[];
};

export type SmartListCategory = {
  name: string;
  items: SmartListItem[];
};

export type SmartListData = {
  id: string;
  weekId: string;
  version: number;
  model: string;
  categories: SmartListCategory[];
  createdAt: string;
};
