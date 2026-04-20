export interface ContractSigner {
  _id: string;
  name: string;
  email?: string;
}

export interface ContractRecord {
  _id: string;
  title: string;
  content: string;
  signedBy: ContractSigner | string;
  signatureData: string;
  photoData: string;
  signedAt: string;
  isLocked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateContractPayload {
  title: string;
  content: string;
  signatureData: string;
  photoData: string;
  signedBy?: string;
}

export interface UpdateContractPayload {
  title?: string;
  content?: string;
  signatureData?: string;
  photoData?: string;
  signedBy?: string;
  signedAt?: string;
}
