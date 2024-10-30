export interface PluginSettingsResponse {
    defaultEntityUid: string;
    defaultApiEndpoint: string;
    defaultPublishedOnly: boolean;
    defaultQueryLimit?: number;
}

export interface PluginQueryRequestBody {
    uid: string;
    filter: string;
    publishedOnly: boolean;
    queryStart?: number;
    queryLimit?: number;
}

export interface ApiEndpointRequestBody {
    apiEndpoint: string;
    filter: string;
    publishedOnly: boolean;
    queryStart?: number;
    queryLimit?: number;
}

export interface DocumentResponse {
    id: number;
    documentId: string;
    publishedAt: string;
}

export interface PluginQueryResponse {
    result: DocumentResponse[];
    mainField: string;
    meta?: {
        total: number;
        pageSize: number;
        pageCount: number;
        currentPage: number;
    }
    errorMessage?: string;
}

export interface MultiSelectItem {
    id: number;
    documentId: string;
    tag: string;
    ref_uid: string;
    ref_entity_id: string;
    ref_published: boolean;
    order: number,
    title?: string;
}

export interface MultiSelectDocumentItem {
    id: number;
    documentId: string;
    tag: string;
    order: number;
}

export interface MultiSelectItemId {
    id: number;
    documentId: string;
}

export interface MultiSelectItemCreateRequest {
    ref_uid: string;
    ref_entity_id: string;
    ref_published: boolean;
    order: number,
}

export interface MultiSelectCreateRequestBody {
    tag: string;
    data: MultiSelectItemCreateRequest[];
}

export interface MultiSelectPublishRequestBody {
    tag: string;
}

export interface GetItemsByTagResult {
    result: MultiSelectItem[];
    errorMessage: string;
}

export interface OrderedDocumentResponse {
    id: number;
    documentId: string;
    order: number;
    tag: string;
}

export interface GetDocumentsByTagResult {
    result: {
        uid: string;
        items: OrderedDocumentResponse[];
    }[];
    errorMessage: string;
}