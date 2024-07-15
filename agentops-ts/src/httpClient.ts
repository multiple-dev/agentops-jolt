import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';

interface HttpResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
}

export class HttpClient {
  private static async request<T>(
    url: string,
    data: any,
    apiKey?: string,
    parentKey?: string,
    jwt?: string,
  ): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: '*/*',
    };

    if (apiKey) {
      headers['X-Agentops-Api-Key'] = apiKey;
    }

    if (parentKey) {
      headers['X-Agentops-Parent-Key'] = parentKey;
    }

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }

    const config: AxiosRequestConfig = {
      url,
      method: 'post',
      headers,
      data,
      timeout: 20000,
    };

    try {
      const response: AxiosResponse<T> = await axios(config);
      return {
        ok: response.status >= 200 && response.status < 300,
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      const axiosError = error as AxiosError;
      return {
        ok: false,
        status: axiosError.response?.status || 500,
        data: (axiosError.response?.data as T) || ({ error: axiosError.message } as T),
      };
    }
  }

  static async post<T>(
    url: string,
    data: any,
    jwt?: string,
    apiKey?: string,
    parentKey?: string,
  ): Promise<HttpResponse<T>> {
    return HttpClient.request<T>(url, data, apiKey, parentKey, jwt);
  }
}
