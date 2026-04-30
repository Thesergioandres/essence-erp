import { httpClient } from "../../../shared/api/httpClient";
import type { BulkSalePayload, SaleResponse } from "../types/sales.types";

export const salesService = {
  registerBulkSale: async (payload: BulkSalePayload): Promise<SaleResponse> => {
    // V2 Endpoint - Atomic Transaction support with strict multi-tenant context
    const response = await httpClient.post<SaleResponse>("/sales", {
      ...payload,
      // Ensure specific businessId is present even if already in headers
      businessId: payload.businessId,
    });
    return response.data;
  },
};
