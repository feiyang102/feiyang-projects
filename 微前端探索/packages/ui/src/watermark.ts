export interface WatermarkOptions {
  /** 水印文字，默认由用户名与日期生成 */
  text?: string
  /** 透明度，0-1，默认 0.08 */
  opacity?: number
  /** 文字颜色，默认 #8c8c8c */
  color?: string
  /** 单个水印的间距，默认 120 */
  gap?: number
  /** 字号，默认 14 */
  fontSize?: number
}

/**
 * 将水印文字绘制为可平铺的 PNG DataURL。
 * 环境不支持 canvas 时返回空字符串，由调用方退化为纯色遮罩。
 */
export function createWatermarkDataUrl(text: string, options: WatermarkOptions = {}): string {
  if (typeof document === 'undefined' || !text) return ''
  const opacity = options.opacity ?? 0.08
  const color = options.color ?? '#8c8c8c'
  const gap = options.gap ?? 120
  const fontSize = options.fontSize ?? 14

  const canvas = document.createElement('canvas')
  const ratio = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1
  const width = gap * 2
  const height = gap
  canvas.width = width * ratio
  canvas.height = height * ratio

  let ctx: CanvasRenderingContext2D | null = null
  try {
    ctx = canvas.getContext('2d')
  } catch {
    // 无 canvas 环境（如测试或服务端）直接跳过
    return ''
  }
  if (!ctx) return ''

  ctx.scale(ratio, ratio)
  ctx.translate(width / 2, height / 2)
  ctx.rotate(-Math.PI / 6)
  ctx.globalAlpha = opacity
  ctx.fillStyle = color
  ctx.font = `${fontSize}px system-ui, -apple-system, "PingFang SC", sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, 0, 0)

  return canvas.toDataURL('image/png')
}
