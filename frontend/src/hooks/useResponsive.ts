import { useState, useEffect } from 'react'

// 断点定义
const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
}

export const useResponsive = () => {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // 添加事件监听器
    window.addEventListener('resize', handleResize)

    // 清理事件监听器
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowSize.width < breakpoints.md
  const isTablet = windowSize.width >= breakpoints.md && windowSize.width < breakpoints.lg
  const isDesktop = windowSize.width >= breakpoints.lg
  const isSmallScreen = windowSize.width < breakpoints.lg

  // 响应式布局配置
  const getLayoutConfig = () => {
    if (isMobile) {
      return {
        sidebarVariant: 'overlay' as const,
        sidebarWidth: '100%',
        showPreviewPanel: false,
        stackLayout: true,
        compactHeader: true
      }
    }

    if (isTablet) {
      return {
        sidebarVariant: 'slide' as const,
        sidebarWidth: '300px',
        showPreviewPanel: true,
        stackLayout: false,
        compactHeader: false
      }
    }

    return {
      sidebarVariant: 'permanent' as const,
      sidebarWidth: '320px',
      showPreviewPanel: true,
      stackLayout: false,
      compactHeader: false
    }
  }

  return {
    windowSize,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen,
    layoutConfig: getLayoutConfig(),
    breakpoints
  }
}

// Hook for media queries
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }

    const listener = () => setMatches(media.matches)
    
    // 使用新的API或回退到旧的API
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    } else {
      // 兼容旧浏览器
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [matches, query])

  return matches
}

// Hook for touch device detection
export const useTouchDevice = () => {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const checkTouchDevice = () => {
      setIsTouch(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        // @ts-ignore
        navigator.msMaxTouchPoints > 0
      )
    }

    checkTouchDevice()
    
    // 监听触摸事件来确认设备支持触摸
    const handleTouchStart = () => setIsTouch(true)
    
    window.addEventListener('touchstart', handleTouchStart, { once: true })
    
    return () => window.removeEventListener('touchstart', handleTouchStart)
  }, [])

  return isTouch
}

// Hook for orientation detection
export const useOrientation = () => {
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')

  useEffect(() => {
    const handleOrientationChange = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    handleOrientationChange() // 初始检测
    
    window.addEventListener('resize', handleOrientationChange)
    window.addEventListener('orientationchange', handleOrientationChange)

    return () => {
      window.removeEventListener('resize', handleOrientationChange)
      window.removeEventListener('orientationchange', handleOrientationChange)
    }
  }, [])

  return orientation
}