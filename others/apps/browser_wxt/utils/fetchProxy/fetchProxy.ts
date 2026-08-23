import { hrWebInfo } from './const';

interface IFetchProxyRequestOptions extends RequestInit {
  timeout?: number;
  origin?: string;
}

declare global {
  interface Window {
    proxyFetch: any;
  }
}

interface IFetchProxyRequest {
  type: string;
  requestId: string;
  /**
   * 请求的接口地址
   */
  url: string;
  /**
   * 超时时间
   */
  timeout?: number;
  /**
   * 需要哪个tab窗口代理请求（默认选择该链接的第一项）
   */
  origin?: string;
  /**
   * fetch 配置，包含 headers, body 等
   */
  options?: RequestInit & {
    fileOptions?: {
      imageData: string; // 文件的 base64
      filename: string;
    };
    urlSearchParams?: any;
    props?: any;
  };
}

interface IFetchProxyResponse {
  success: boolean;
  type: string;
  requestId: string;
  message?: string;
  data?: any;
}

export class FetchProxy {
  static fetchProxyBackgroundRequest = 'BACKGROUND_PROXY_REQUEST';
  static fetchProxyBackgroundResponse = 'BACKGROUND_PROXY_RESPONSE';
  static fetchProxyTabRequest = 'TAB_PROXY_REQUEST';
  static fetchProxyTabResponse = 'TAB_PROXY_RESPONSE';
  static fetchProxyError = 'TAB_PROXY_ERROR';
  private static defaultTimeout = 30000; // 默认30秒超时
  static base64ToFile(base64Data: string, filename = 'file') {
    // 分割 Data URL，提取 MIME 类型和 Base64 数据
    const arr = base64Data.split(',');
    const mimeMatch = arr[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const bstr = atob(arr[1]); // 解码 Base64 字符串

    // 将二进制数据转换为 Uint8Array
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }

    // 生成 File 对象
    return new File([u8arr], filename, { type: mime });
  }
  static fetchHandler(request: IFetchProxyRequest, sendResponse: Function) {
    const method = request.options?.method || 'GET';
    const headers = request.options?.headers || {
      'Content-Type': 'application/json'
    };
    const timeout = request.timeout || this.defaultTimeout;
    let body;
    if (typeof request.options?.body === 'string') {
      body = request.options.body;
    } else {
      body = request.options?.body ? JSON.stringify(request.options?.body) : undefined;
    }
    if (request.options?.fileOptions && Object.keys(request.options?.fileOptions).length) {
      const fd = new FormData();
      fd.append('file', FetchProxy.base64ToFile(request.options?.fileOptions?.imageData ?? '', request.options?.fileOptions?.filename ?? ''));
      delete request.options?.fileOptions;

      const bodyData = request.options?.body as Record<string, any>;
      if (bodyData && Object.keys(bodyData).length) {
        for (const key in bodyData) {
          fd.append(key, bodyData[key]);
        }
      }
      body = fd;
    }
    if (request.options?.urlSearchParams && Object.keys(request.options?.urlSearchParams).length) {
      body = new URLSearchParams(request.options?.urlSearchParams);
    }
    console.log('fetch options ===', { ...request.options, method, headers, body, ...request.options?.props });
    Promise.race([
      fetch(request.url, { ...request.options, method, headers, body, ...request.options?.props }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('请求超时')), timeout))
    ])
      .then((response: unknown) => {
        if (response instanceof Response) {
          return response.json();
        }
        throw new Error('非法的响应类型');
      })
      .then((data) => {
        console.log(`proxyFetch ${request.requestId} 请求成功:`, data);
        // 定义返回类型
        sendResponse({ success: true, data, requestId: request.requestId, type: request.type });
      })
      .catch((error) => {
        console.error(`proxyFetch ${request.requestId} 请求失败:`, error);
        sendResponse({
          success: false,
          type: this.fetchProxyError,
          error: error.message,
          requestId: request.requestId
        });
      });
  }

  static initContent() {
    // 监听来自页面的消息
    window.addEventListener('message', async (event) => {
      if (event.source !== window) return;
      const { type, requestId } = event.data as IFetchProxyRequest;
      if ([this.fetchProxyBackgroundRequest, this.fetchProxyTabRequest].includes(type)) {
        try {
          const response: IFetchProxyResponse = await browser.runtime.sendMessage(event.data);
          window.postMessage(response, '*');
        } catch (error) {
          window.postMessage(
            {
              success: false,
              type: this.fetchProxyError,
              requestId,
              message: (error as Error).message
            } as IFetchProxyResponse,
            '*'
          );
        }
      }
    });

    // tab fetch 请求实体
    browser.runtime.onMessage.addListener((request: IFetchProxyRequest, sender, sendResponse) => {
      if (request.type === `${this.fetchProxyTabRequest}__HANDLER__`) {
        request.type = this.fetchProxyTabResponse;
        this.fetchHandler(request, sendResponse);
        return true;
      }
    });

    // content 中注入 proxyFetch
    fetchProxyInjectScript();
  }

  static initBackground() {
    browser.runtime.onMessage.addListener((request: IFetchProxyRequest, sender, sendResponse) => {
      if (request.type === this.fetchProxyBackgroundRequest) {
        request.type = this.fetchProxyBackgroundResponse;
        this.fetchHandler(request, sendResponse);
        return true;
      }
      if (request.type === this.fetchProxyTabRequest) {
        let match_pattern;
        let originUrl = request.origin || new URL(request.url).origin;
        if (hrWebInfo.collect_supported.includes(request.origin as string)) {
          const origin = request.origin as keyof typeof hrWebInfo;
          match_pattern = (hrWebInfo[origin] as any)?.match_pattern;
          originUrl = (hrWebInfo[origin] as any)?.home;
        } else {
          // https://www.zhipin.com/*
          match_pattern = `${originUrl}/*`;
        }

        browser.tabs.query({ url: match_pattern }, async (tabs) => {
          if (tabs.length === 0) {
            await browser.tabs.create({ url: originUrl });
            sendResponse({
              success: false,
              type: this.fetchProxyError,
              requestId: request.requestId,
              message: `请登录：${originUrl}`
            } as IFetchProxyResponse);
            return;
          }

          const tab_fetch = tabs[0];
          browser.tabs.sendMessage(
            tab_fetch.id as number,
            {
              ...request,
              type: `${this.fetchProxyTabRequest}__HANDLER__`
            },
            (response) => {
              console.log('Background 接收到 tab proxy response: ', response);
              sendResponse(response);
            }
          );
        });
        return true;
      }
    });
  }
}

export function fetchProxyInjectScript() {
  const proxyFetchObj = {
    fetchProxyBackgroundRequest: 'BACKGROUND_PROXY_REQUEST',
    fetchProxyBackgroundResponse: 'BACKGROUND_PROXY_RESPONSE',
    fetchProxyTabRequest: 'TAB_PROXY_REQUEST',
    fetchProxyTabResponse: 'TAB_PROXY_RESPONSE',
    fetchProxyError: 'TAB_PROXY_ERROR',
    requestCount: 0,
    defaultTimeout: 30000,

    fetchHandler(url: string | URL, options: IFetchProxyRequestOptions = {}, fetchHandler: 'background' | 'tab' = 'background') {
      const requestId = `${Date.now()}:${++this.requestCount}`;
      const { timeout = this.defaultTimeout, origin, ...fetchOptions } = options;
      let proxyMsgTypeRequest = this.fetchProxyBackgroundRequest;
      let proxyMsgTypeResponse = this.fetchProxyBackgroundResponse;
      if (fetchHandler === 'tab') {
        proxyMsgTypeRequest = this.fetchProxyTabRequest;
        proxyMsgTypeResponse = this.fetchProxyTabResponse;
      }

      return new Promise((resolve, reject) => {
        window.postMessage(
          {
            type: proxyMsgTypeRequest,
            requestId,
            url,
            timeout,
            origin,
            options: fetchOptions
          } as IFetchProxyRequest,
          '*'
        );
        console.log(`proxyFetch ${requestId} 发送请求：`, {
          type: proxyMsgTypeRequest,
          requestId,
          url,
          timeout,
          origin,
          options: fetchOptions
        });
        const handleMessage = (event: any) => {
          const { success, type, data, message, requestId: responseId } = event.data;
          if (responseId !== requestId) return;
          if (type === proxyMsgTypeResponse) {
            window.removeEventListener('message', handleMessage);
            resolve(data);
            console.log(`proxyFetch ${requestId} 请求成功：`, data);
          }
          if (type === this.fetchProxyError || success === false) {
            window.removeEventListener('message', handleMessage);
            reject(new Error(message));
            console.log(`proxyFetch ${requestId} 请求失败：`, message);
          }
        };
        window.addEventListener('message', handleMessage);

        setTimeout(() => {
          window.removeEventListener('message', handleMessage);
          reject(new Error('请求超时'));
        }, timeout);
      });
    },
    fetchBackground(url: string, options: IFetchProxyRequestOptions = {}) {
      return this.fetchHandler(url, options, 'background');
    },
    fetchTab(url: string | URL, options: IFetchProxyRequestOptions = {}) {
      return this.fetchHandler(url, options, 'tab');
    },
    // 如果不传参，就是当前的 cookie
    // url: string, name: string
    // url 可以是链接、域名，name 不传就返回所有，传就返回一个
    getCookie(url: string, name: string) {
      console.log('url, name === ', url, name);
    }
  };
  if (!window.proxyFetch) {
    window.proxyFetch = proxyFetchObj.fetchHandler.bind(proxyFetchObj);
    window.proxyFetch.bg = proxyFetchObj.fetchBackground.bind(proxyFetchObj);
    window.proxyFetch.tab = proxyFetchObj.fetchTab.bind(proxyFetchObj);
    window.proxyFetch.getCookie = proxyFetchObj.getCookie.bind(proxyFetchObj);
    console.log('=== proxyFetch 已注入 ===');
  }
}
