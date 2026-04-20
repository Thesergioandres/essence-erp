import api from "../../../api/axios";
import type {
  ContractRecord,
  CreateContractPayload,
  UpdateContractPayload,
} from "../types/contract.types";

const normalizePayload = <T>(payload: unknown): T => {
  const wrapper = payload as { data?: T };
  return (wrapper?.data || payload) as T;
};

export const contractService = {
  async list(params?: { signedBy?: string }): Promise<ContractRecord[]> {
    const response = await api.get("/contracts", { params });
    return normalizePayload<ContractRecord[]>(response.data);
  },

  async getById(id: string): Promise<ContractRecord> {
    const response = await api.get(`/contracts/${id}`);
    return normalizePayload<ContractRecord>(response.data);
  },

  async create(data: CreateContractPayload): Promise<ContractRecord> {
    const response = await api.post("/contracts", data);
    return normalizePayload<ContractRecord>(response.data);
  },

  async update(
    id: string,
    data: UpdateContractPayload
  ): Promise<ContractRecord> {
    const response = await api.put(`/contracts/${id}`, data);
    return normalizePayload<ContractRecord>(response.data);
  },

  async remove(id: string): Promise<{ deletedId: string; message: string }> {
    const response = await api.delete(`/contracts/${id}`);
    return normalizePayload<{ deletedId: string; message: string }>(
      response.data
    );
  },
};
