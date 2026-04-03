import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Nutrify',
    short_name: 'Nutrify',
    description: 'Your AI-powered nutrition companion for healthy eating in Ghana.',
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#f2f5f4',
    theme_color: '#00b371',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/icon-512x512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable'
      }
    ],
  }
}
