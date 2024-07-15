import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axiosRetry from 'axios-retry';

enum HttpStatus {
  SUCCESS = 200,
  INVALID_REQUEST = 400,
  INVALID_API_KEY = 401,
  TIMEOUT = 408,
  PAYLOAD_TOO_LARGE = 413,
  TOO_MANY_REQUESTS = 429,
  FAILED = 500,
  UNKNOWN = -1,
}

interface Response {
  status: HttpStatus;
  code: number;
  body: Record<string, any>;
}

interface RequestOptions extends AxiosRequestConfig {
  apiKey?: string;
  parentKey?: string;
  jwt?: string;
}

export class HttpClient {
  private static instance: AxiosInstance;

  private static getInstance(): AxiosInstance {
    if (!HttpClient.instance) {
      HttpClient.instance = axios.create();
      axiosRetry(HttpClient.instance, { retries: 5, retryDelay: axiosRetry.exponentialDelay });
    }
    return HttpClient.instance;
  }

  private static getStatus(code: number): HttpStatus {
    if (code >= 200 && code < 300) return HttpStatus.SUCCESS;
    if (code === 429) return HttpStatus.TOO_MANY_REQUESTS;
    if (code === 413) return HttpStatus.PAYLOAD_TOO_LARGE;
    if (code === 408) return HttpStatus.TIMEOUT;
    if (code === 401) return HttpStatus.INVALID_API_KEY;
    if (code >= 400 && code < 500) return HttpStatus.INVALID_REQUEST;
    if (code >= 500) return HttpStatus.FAILED;
    return HttpStatus.UNKNOWN;
  }

  public static async post(url: string, payload: string, options: RequestOptions = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': '*/*',
    };

    if (options.apiKey) {
      headers['X-Agentops-Api-Key'] = options.apiKey;
    }

    if (options.parentKey) {
      headers['X-Agentops-Parent-Key'] = options.parentKey;
    }

    if (options.jwt) {
      headers['Authorization'] = `Bearer ${options.jwt}`;
    }

    try {
      const response: AxiosResponse = await HttpClient.getInstance().post(url, payload, {
        ...options,
        headers,
        timeout: 20000, // 20 seconds timeout
      });

      return {
        status: HttpClient.getStatus(response.status),
        code: response.status,
        body: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          const status = HttpClient.getStatus(error.response.status);
          console.warn(`HTTP Error ${error.response.status}: ${error.message}`);
          return {
            status,
            code: error.response.status,
            body: error.response.data || { error: error.message },
          };
        } else if (error.request) {
          // The request was made but no response was received
          console.warn('No response received:', error.message);
          return {
            status: HttpStatus.TIMEOUT,
            code: 408,
            body: { error: 'No response received' },
          };
        }
      }
      // Something happened in setting up the request that triggered an Error
      console.warn('Error:', error);
      return {
        status: HttpStatus.UNKNOWN,
        code: -1,
        body: { error: 'Unknown error occurred' },
      };
    }
  }
}

// Export types and enums for use in other parts of the SDK
export { HttpStatus };
export type { Response, RequestOptions };
