import QRCode from 'qrcode'

export async function generateQRCode(text: string): Promise<string> {
  try {
    return await QRCode.toDataURL(text, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
  } catch (error) {
    console.error('Failed to generate QR code:', error)
    return ''
  }
}

export function maskName(fullName: string): string {
  const parts = fullName.trim().split(' ')
  if (parts.length === 1) {
    return parts[0].charAt(0) + '***'
  }
  const firstName = parts[0]
  const lastName = parts[parts.length - 1]
  return `${firstName} ${lastName.charAt(0)}.`
}