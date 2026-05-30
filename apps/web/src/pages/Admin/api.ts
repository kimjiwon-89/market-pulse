import { apiClient } from "@/services/apiClient";

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string | null;
}

export interface QuantModelPackage {
  modelCode: string;
  modelName: string;
  modelVersion: string;
  category: string;
  description?: string;
  packagePath: string;
  packageStatus: string;
  publicVisible: boolean;
  runtimeReady: boolean;
  adminNote?: string;
  discoveredAt?: string;
  updatedAt?: string;
}

export interface QuantModelPackageVisibilityUpdate {
  publicVisible: boolean;
  packageStatus: string;
  adminNote: string;
}

async function getData<T>(request: Promise<{ data: ApiResponse<T> | T }>): Promise<T> {
  const response = await request;
  const body = response.data;
  if (body && typeof body === "object" && "success" in body && "data" in body) {
    const wrapped = body as ApiResponse<T>;
    if (!wrapped.success) throw new Error(wrapped.message ?? "API 요청이 실패했습니다.");
    return wrapped.data;
  }
  return body as T;
}

export function listQuantModelPackages() {
  return getData<QuantModelPackage[]>(apiClient.get("/admin/quant/packages"));
}

export function scanQuantModelPackages() {
  return getData<QuantModelPackage[]>(apiClient.post("/admin/quant/packages/scan"));
}

export function updateQuantModelPackageVisibility(modelCode: string, payload: QuantModelPackageVisibilityUpdate) {
  return getData<QuantModelPackage>(apiClient.patch(`/admin/quant/packages/${modelCode}/visibility`, payload));
}
