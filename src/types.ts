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

// ── Domain types (matching API response shapes) ──────────────

export interface Product {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ProductDetail extends Product {
  feature_count: number;
  document_count: number;
}

export interface FeatureSummary {
  slug: string;
  title: string;
  content: string;
}

export interface FeatureDetail extends FeatureSummary {
  wireframes: Record<string, unknown>;
}

export interface DocumentSummary {
  path: string;
  content_preview: string;
}

export interface DocumentFull {
  path: string;
  content: string;
}

export interface SearchResult {
  path: string;
  content_snippet: string;
}

export interface FeatureRelation {
  source_slug: string;
  target_slug: string;
  relation_type: string;
  context: string | null;
}
