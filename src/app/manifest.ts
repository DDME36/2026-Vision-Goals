import type { MetadataRoute } from 'next'
import { APP_NAME, BRAND } from '@/lib/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} by ${BRAND}`,
    short_name: APP_NAME,
    description: 'ตั้งเป้าหมายและติดตามความคืบหน้าตลอดทั้งปี',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8f4',
    theme_color: '#faf8f4',
    orientation: 'portrait-primary',
    lang: 'th',
    icons: [{ src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
  }
}
