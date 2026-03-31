import axios, { AxiosRequestConfig } from "axios";
import type { Template, Layout, CreateTemplateInput, V2Config } from "@/types";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  endpoint: string,
  options: AxiosRequestConfig,
  config: V2Config,
): Promise<T> {
  const baseURL = config.baseUrl.replace(/\/$/, "");

  try {
    const response = await axios({
      url: `${baseURL}${endpoint}`,
      ...options,
      headers: {
        ...options.headers,
        "X-PreviewMail-Key": config.apiKey,
      },
    });
    
    // Protect against HTML 404 pages (often returned as 200 by Next.js app router fallbacks)
    if (typeof response.data === 'string' && response.data.trim().startsWith('<')) {
      throw new ApiError(500, "Received HTML response instead of JSON. Please check if your Base URL is pointing to the correct NestJS API port (3001), not the frontend.");
    }

    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new ApiError(
        error.response.status,
        error.response.data?.message || error.response.statusText || "Request failed"
      );
    }
    throw new ApiError(500, error instanceof Error ? error.message : "Unknown network error");
  }
}

export const apiClient = {
  async getTemplates(
    config: V2Config,
    page = 1,
    limit = 50,
  ): Promise<Template[]> {
    return request<Template[]>(
      `/previewmail/templates?page=${page}&limit=${limit}`,
      { method: "GET" },
      config,
    );
  },

  async getTemplateByAlias(config: V2Config, alias: string): Promise<Template> {
    return request<Template>(
      `/previewmail/templates/${alias}`,
      { method: "GET" },
      config,
    );
  },

  async createTemplate(
    config: V2Config,
    data: Template | CreateTemplateInput,
  ): Promise<Template> {
    return request<Template>(
      "/previewmail/templates",
      {
        method: "POST",
        data,
      },
      config,
    );
  },

  async updateTemplate(
    config: V2Config,
    id: string,
    data: Partial<Template>,
  ): Promise<Template> {
    return request<Template>(
      `/previewmail/templates/${id}`,
      {
        method: "PUT",
        data,
      },
      config,
    );
  },

  async deleteTemplate(config: V2Config, id: string): Promise<void> {
    return request<void>(
      `/previewmail/templates/${id}`,
      { method: "DELETE" },
      config,
    );
  },

  // Layouts
  async getLayouts(
    config: V2Config,
    page = 1,
    limit = 50,
  ): Promise<Layout[]> {
    return request<Layout[]>(
      `/previewmail/layouts?page=${page}&limit=${limit}`,
      { method: "GET" },
      config,
    );
  },

  async getLayoutByAlias(config: V2Config, alias: string): Promise<Layout> {
    return request<Layout>(
      `/previewmail/layouts/${alias}`,
      { method: "GET" },
      config,
    );
  },

  async createLayout(
    config: V2Config,
    data: Partial<Layout>,
  ): Promise<Layout> {
    return request<Layout>(
      "/previewmail/layouts",
      {
        method: "POST",
        data,
      },
      config,
    );
  },

  async updateLayout(
    config: V2Config,
    id: string,
    data: Partial<Layout>,
  ): Promise<Layout> {
    return request<Layout>(
      `/previewmail/layouts/${id}`,
      {
        method: "PUT",
        data,
      },
      config,
    );
  },

  async deleteLayout(config: V2Config, id: string): Promise<void> {
    return request<void>(
      `/previewmail/layouts/${id}`,
      { method: "DELETE" },
      config,
    );
  },
};
