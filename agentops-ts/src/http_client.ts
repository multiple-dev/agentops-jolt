import axios, { AxiosError, AxiosResponse } from 'axios';

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
  body: any;
}

const JSON_HEADER = {
  'Content-Type': 'application/json; charset=UTF-8',
  Accept: '*/*',
};

class HttpClient {
  static async post(
    url: string,
    payload: string,
    apiKey?: string,
    parentKey?: string,
    jwt?: string
  ): Promise<Response> {
    const headers = { ...JSON_HEADER };

    if (apiKey) {
      headers['X-Agentops-Api-Key'] = apiKey;
    }

    if (parentKey) {
      headers['X-Agentops-Parent-Key'] = parentKey;
    }

    if (jwt) {
      headers['Authorization'] = `Bearer ${jwt}`;
    }

    try {
      const response: AxiosResponse = await axios.post(url, payload, {
        headers,
        timeout: 20000,
      });

      return {
        status: HttpClient.getStatus(response.status),
        code: response.status,
        body: response.data,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          return {
            status: HttpClient.getStatus(axiosError.response.status),
            code: axiosError.response.status,
            body: axiosError.response.data,
          };
        }
      }

      return {
        status: HttpStatus.UNKNOWN,
        code: HttpStatus.UNKNOWN,
        body: { error: (error as Error).message },
      };
    }
  }

  private static getStatus(code: number): HttpStatus {
    return Object.values(HttpStatus).includes(code as HttpStatus)
      ? (code as HttpStatus)
      : HttpStatus.UNKNOWN;
  }
}

export default HttpClient;
