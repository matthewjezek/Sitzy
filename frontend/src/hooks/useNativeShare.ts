import { useCallback, useEffect, useState } from 'react'

interface ShareData {
  title?: string
  text?: string
  url?: string
}

export function useNativeShare() {
  const [isMobile, setIsMobile] = useState(false)
  const [isSupported, setIsSupported] = useState(false)

  useEffect(() => {
    // Detect mobile device
    const userAgent = navigator.userAgent || navigator.vendor || (window as unknown as { opera?: string }).opera || ''
    const mobileRegex = /android|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
    setIsMobile(mobileRegex.test(userAgent))

    // Check if Web Share API is supported
    setIsSupported(!!navigator.share)
  }, [])

  const share = useCallback(async (data: ShareData) => {
    if (navigator.share) {
      try {
        await navigator.share(data)
        return true
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error('Error sharing:', error)
        }
        return false
      }
    }
    return false
  }, [])

  return {
    isMobile,
    isSupported,
    share,
  }
}
