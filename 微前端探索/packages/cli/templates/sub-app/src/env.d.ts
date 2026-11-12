/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface WujieBus {
  $emit(event: string, ...args: unknown[]): void
  $on(event: string, handler: (...args: unknown[]) => void): void
}

interface WujieProps {
  userName?: string
  permissions?: string[]
  theme?: Record<string, string>
  initialPath?: string
  [key: string]: unknown
}

declare global {
  interface Window {
    __POWERED_BY_WUJIE__?: boolean
    $wujie?: { props?: WujieProps; bus?: WujieBus }
  }
}

export {}
