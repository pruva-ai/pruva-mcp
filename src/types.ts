/** Pruva API action names — must match the server-side route handler */
export type PruvaAction =
  | "list_products"
  | "get_product"
  | "list_features"
  | "get_feature"
  | "create_feature"
  | "update_feature"
  | "list_documents"
  | "get_document"
  | "create_document"
  | "update_document"
  | "search_documents"
  | "get_feature_relations";

/** Shape returned by the Pruva API on success */
export interface PruvaApiResponse<T = unknown> {
  data: T;
}

/** Shape returned by the Pruva API on error */
export interface PruvaApiError {
  error: string;
}

// ── Domain types (matching API select columns) ───────────────

export interface Product {
  id: string;
  name: string;
  description: string | null;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Feature {
  id: string;
  product_id: string;
  slug: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentMeta {
  id: string;
  product_id: string;
  path: string;
  version: number;
  doc_type: string;
  feature_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentFull extends DocumentMeta {
  content: string | null;
}

export interface SearchResult {
  id: string;
  path: string;
  doc_type: string;
  feature_id: string | null;
  content_snippet: string;
}

export interface FeatureRelation {
  id: string;
  source_feature: string;
  target_feature: string;
  relation_type: string;
  context: string | null;
  source_slug?: string;
  target_slug?: string;
  source_title?: string;
  target_title?: string;
}
