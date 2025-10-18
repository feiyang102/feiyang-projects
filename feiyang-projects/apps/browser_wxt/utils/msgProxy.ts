/// <reference types="chrome"/>

/**
 * 消息代理类，用于处理浏览器扩展中不同组件间的通信
 * 支持 Content Script、Background 和 Popup 之间的消息传递
 */
export class MsgProxy {
  private static instance: MsgProxy;
  private messageHandlers: Map<string, Array<(data: any, sender: chrome.runtime.MessageSender) => void>>;
  private pendingResponses: Map<string, { resolve: (value: any) => void, reject: (reason?: any) => void, timeout: NodeJS.Timeout }>;
  private nextRequestId: number;

  private constructor() {
    this.messageHandlers = new Map();
    this.pendingResponses = new Map();
    this.nextRequestId = 0;

    // 初始化消息监听器
    this.initMessageListener();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): MsgProxy {
    if (!MsgProxy.instance) {
      MsgProxy.instance = new MsgProxy();
    }
    return MsgProxy.instance;
  }

  /**
   * 初始化消息监听器
   */
  private initMessageListener(): void {
    chrome.runtime.onMessage.addListener((message: any, sender: chrome.runtime.MessageSender, sendResponse: (response?: any) => void) => {
      // 处理响应消息
      if (message.type === 'response' && message.requestId) {
        const pending = this.pendingResponses.get(message.requestId);
        if (pending) {
          clearTimeout(pending.timeout);
          if (message.error) {
            pending.reject(new Error(message.error));
          } else {
            pending.resolve(message.data);
          }
          this.pendingResponses.delete(message.requestId);
        }
        return;
      }

      // 处理请求消息
      if (message.type === 'request' && message.action) {
        const handlers = this.messageHandlers.get(message.action);
        if (handlers && handlers.length > 0) {
          // 支持异步处理，返回Promise
          const results = handlers.map(handler => {
            try {
              const result = handler(message.data, sender);
              // 检查是否是Promise
              if (result !== undefined && typeof (result as any)?.then === 'function') {
                return result as Promise<any>;
              } else {
                return Promise.resolve(result);
              }
            } catch (error) {
              return Promise.reject(error);
            }
          });

          // 等待所有处理程序完成
          Promise.all(results)
            .then(data => {
              sendResponse({
                success: true,
                data: data.length === 1 ? data[0] : data
              });
            })
            .catch(error => {
              sendResponse({
                success: false,
                error: error instanceof Error ? error.message : '处理请求时发生错误'
              });
            });

          // 表示会异步调用sendResponse
          return true;
        } else {
          sendResponse({
            success: false,
            error: `未找到处理程序: ${message.action}`
          });
        }
      }

      return false;
    });
  }

  /**
   * 注册消息处理程序
   * @param action 消息类型
   * @param handler 处理函数
   */
  public on(action: string, handler: (data: any, sender: chrome.runtime.MessageSender) => void): void {
    if (!this.messageHandlers.has(action)) {
      this.messageHandlers.set(action, []);
    }
    this.messageHandlers.get(action)?.push(handler);
  }

  /**
   * 移除消息处理程序
   * @param action 消息类型
   * @param handler 处理函数（可选，如不提供则移除所有该类型的处理程序）
   */
  public off(action: string, handler?: (data: any, sender: chrome.runtime.MessageSender) => void): void {
    if (!this.messageHandlers.has(action)) {
      return;
    }

    if (handler) {
      const handlers = this.messageHandlers.get(action);
      if (handlers) {
        const index = handlers.indexOf(handler);
        if (index !== -1) {
          handlers.splice(index, 1);
        }
        // 如果没有处理程序了，删除该键
        if (handlers.length === 0) {
          this.messageHandlers.delete(action);
        }
      }
    } else {
      // 移除所有处理程序
      this.messageHandlers.delete(action);
    }
  }

  /**
   * 发送消息到Background
   * @param action 消息类型
   * @param data 消息数据
   * @param timeout 超时时间（毫秒），默认5000
   */
  public sendToBackground(action: string, data: any, timeout: number = 5000): Promise<any> {
    return this.sendMessage(action, data, timeout);
  }

  /**
   * 发送消息到Content Script
   * @param tabId 标签页ID
   * @param action 消息类型
   * @param data 消息数据
   * @param timeout 超时时间（毫秒），默认5000
   */
  public sendToContent(tabId: number, action: string, data: any, timeout: number = 5000): Promise<any> {
    return new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      const requestId = this.generateRequestId();

      const timeoutId = setTimeout(() => {
        this.pendingResponses.delete(requestId);
        reject(new Error(`发送到标签页 ${tabId} 的消息超时`));
      }, timeout);

      this.pendingResponses.set(requestId, { resolve, reject, timeout: timeoutId });

      try {
        chrome.tabs.sendMessage(tabId, {
          type: 'request',
          action,
          data,
          requestId
        }, (response: any) => {
          if (chrome.runtime.lastError) {
            clearTimeout(timeoutId);
            this.pendingResponses.delete(requestId);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response) {
            clearTimeout(timeoutId);
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || '未知错误'));
            }
            this.pendingResponses.delete(requestId);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingResponses.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * 发送消息（通用方法）
   * @param action 消息类型
   * @param data 消息数据
   * @param timeout 超时时间（毫秒），默认5000
   */
  private sendMessage(action: string, data: any, timeout: number = 5000): Promise<any> {
    return new Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
      const requestId = this.generateRequestId();

      const timeoutId = setTimeout(() => {
        this.pendingResponses.delete(requestId);
        reject(new Error('消息超时'));
      }, timeout);

      this.pendingResponses.set(requestId, { resolve, reject, timeout: timeoutId });

      try {
        chrome.runtime.sendMessage({
          type: 'request',
          action,
          data,
          requestId
        }, (response: any) => {
          if (chrome.runtime.lastError) {
            clearTimeout(timeoutId);
            this.pendingResponses.delete(requestId);
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          if (response) {
            clearTimeout(timeoutId);
            if (response.success) {
              resolve(response.data);
            } else {
              reject(new Error(response.error || '未知错误'));
            }
            this.pendingResponses.delete(requestId);
          }
        });
      } catch (error) {
        clearTimeout(timeoutId);
        this.pendingResponses.delete(requestId);
        reject(error);
      }
    });
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    this.nextRequestId += 1;
    return `req_${Date.now()}_${this.nextRequestId}`;
  }
}

// 导出单例实例
export const msgProxy = MsgProxy.getInstance();