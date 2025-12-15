
import React, { ReactNode } from 'react'

interface PageWrapperProps {
  children: ReactNode
}

export const PageWrapper: React.FC<PageWrapperProps> = ({ children }) => {
  return <div className="animate-fade-in">{children}</div>
}
