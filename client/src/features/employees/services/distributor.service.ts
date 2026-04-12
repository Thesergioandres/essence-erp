/**
 * Distributor Services
 * Extracted from monolithic api/services.ts
 * Handles distributor operations
 */

import api from "../../../api/axios";
import type { User } from "../../auth/types/auth.types";
import type { Distributor } from "../../business/types/business.types";

const DISTRIBUTOR_ENDPOINT_CANDIDATES = ["/distributors", "/employees"];
let cachedDistributorEndpoint: string | null = null;

const isNotFoundError = (error: unknown): boolean =>
  Boolean(
    (error as { response?: { status?: number } })?.response?.status === 404
  );

const requestWithDistributorEndpointFallback = async <T>(
  requestFactory: (endpoint: string) => Promise<T>
): Promise<T> => {
  const endpoints = cachedDistributorEndpoint
    ? [
        cachedDistributorEndpoint,
        ...DISTRIBUTOR_ENDPOINT_CANDIDATES.filter(
          endpoint => endpoint !== cachedDistributorEndpoint
        ),
      ]
    : [...DISTRIBUTOR_ENDPOINT_CANDIDATES];

  let lastError: unknown;

  for (const endpoint of endpoints) {
    try {
      const result = await requestFactory(endpoint);
      cachedDistributorEndpoint = endpoint;
      return result;
    } catch (error) {
      lastError = error;
      if (!isNotFoundError(error)) {
        throw error;
      }
    }
  }

  throw lastError;
};

export const distributorService = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    active?: boolean;
    businessId?: string;
  }): Promise<{
    data: User[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
      hasMore: boolean;
    };
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.get(endpoint, { params })
    );
    const apiResponse = response.data;

    // V2 API devuelve { success: true, data: {...} }
    const actualData = apiResponse.data || apiResponse;

    // Handle both array and paginated response formats
    if (Array.isArray(actualData)) {
      return {
        data: actualData,
        pagination: {
          page: 1,
          limit: actualData.length,
          total: actualData.length,
          pages: 1,
          hasMore: false,
        },
      };
    }
    return actualData;
  },

  async getById(id: string): Promise<{
    distributor: User;
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.get(`${endpoint}/${id}`)
    );
    // V2 API returns { success: true, data: distributor }
    // Frontend expects { distributor: User }
    const apiResponse = response.data;
    return {
      distributor: apiResponse.data || apiResponse.distributor || apiResponse,
    };
  },

  async create(data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    routes?: string[];
  }): Promise<{
    message: string;
    distributor: Distributor;
    user: User;
    password: string;
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.post(endpoint, data)
    );
    // V2 API devuelve { success: true, data: {...} }
    const apiResponse = response.data;
    return apiResponse.data || apiResponse;
  },

  async update(
    id: string,
    data: Partial<{
      name: string;
      phone: string;
      address: string;
      routes: string[];
    }>
  ): Promise<{
    message: string;
    distributor: Distributor;
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.put(`${endpoint}/${id}`, data)
    );
    // V2 API devuelve { success: true, data: {...} }
    const apiResponse = response.data;
    return apiResponse.data || apiResponse;
  },

  async delete(id: string): Promise<{
    message: string;
    distributorNameSnapshot: string;
    returnedUnits: number;
    returnedProducts: number;
    affectedSales: number;
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.delete(`${endpoint}/${id}`)
    );
    // V2 API devuelve { success: true, data: {...} }
    const apiResponse = response.data;
    return apiResponse.data || apiResponse;
  },

  async toggleActive(id: string): Promise<{
    message: string;
    distributor: User;
  }> {
    return requestWithDistributorEndpointFallback(async endpoint => {
      try {
        const response = await api.put(`${endpoint}/${id}/toggle-active`, null);
        const apiResponse = response.data;
        return apiResponse.data || apiResponse;
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }

        const currentResponse = await api.get(`${endpoint}/${id}`);
        const currentApiResponse = currentResponse.data;
        const currentDistributor =
          currentApiResponse.data ||
          currentApiResponse.distributor ||
          currentApiResponse;

        const nextActive = currentDistributor?.active === false;
        const legacyResponse = await api.put(`${endpoint}/${id}`, {
          active: nextActive,
        });
        const legacyApiResponse = legacyResponse.data;
        const updatedDistributor = legacyApiResponse.data || legacyApiResponse;

        return {
          message: nextActive
            ? "Empleado activado correctamente"
            : "Empleado pausado correctamente",
          distributor: updatedDistributor,
        };
      }
    });
  },

  async getProfile(): Promise<{
    distributor: Distributor;
    stats: {
      totalSales: number;
      totalProducts: number;
      revenue: number;
    };
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.get(`${endpoint}/me/profile`)
    );
    // V2 API devuelve { success: true, data: { distributor, stats } }
    const apiResponse = response.data;
    return apiResponse.data || apiResponse;
  },

  async getProducts(distributorId?: string): Promise<{
    products: Array<{
      product: {
        _id: string;
        name: string;
        description?: string;
        mainImage?: {
          url: string;
          thumbnailUrl?: string;
        };
        category?: {
          _id: string;
          name: string;
        };
        basePrice: number;
        purchasePrice?: number;
        averageCost?: number;
        distributorPrice: number;
        clientPrice?: number;
        sku?: string;
        isActive: boolean;
      };
      quantity: number;
      lastRestock?: Date;
    }>;
    total: number;
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint => {
      const url = distributorId
        ? `${endpoint}/${distributorId}/products`
        : `${endpoint}/me/products`;

      return api.get(url);
    });

    // V2 API devuelve { success: true, data: { products, total } }
    const apiResponse = response.data;
    const result = apiResponse.data || apiResponse;

    return result;
  },

  async getPublicCatalog(distributorId: string): Promise<{
    products: Array<any>;
    distributor: {
      name: string;
      phone?: string;
      email?: string;
    } | null;
    business: {
      name?: string;
      logoUrl?: string | null;
    } | null;
  }> {
    const response = await requestWithDistributorEndpointFallback(endpoint =>
      api.get(`${endpoint}/${distributorId}/catalog`)
    );
    const payload = response.data?.data || response.data;

    return {
      products: payload?.products || response.data?.products || [],
      distributor: payload?.distributor || response.data?.distributor || null,
      business: payload?.business || response.data?.business || null,
    };
  },
};
