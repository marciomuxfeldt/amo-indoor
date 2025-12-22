// Script de teste para detectar tipo de mídia

const testUrls = [
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  'https://youtu.be/dQw4w9WgXcQ',
  'https://vimeo.com/123456789',
  'https://example.com/video.mp4',
  'https://i.imgur.com/abc123.jpg',
  '/images/photo.jpg'
]

function detectMediaType(url, type) {
  const isVideo = type === 'video' || 
                  url?.includes('youtube') ||
                  url?.includes('vimeo') ||
                  url?.match(/\.(mp4|webm|ogg)$/i)
  
  return isVideo ? 'video' : 'image'
}

console.log('=== TESTE DE DETECÇÃO DE TIPO DE MÍDIA ===\n')

testUrls.forEach(url => {
  const detectedAsVideo = detectMediaType(url, 'video')
  const detectedAsImage = detectMediaType(url, 'image')
  
  console.log(`URL: ${url}`)
  console.log(`  Com type='video': ${detectedAsVideo}`)
  console.log(`  Com type='image': ${detectedAsImage}`)
  console.log('')
})
