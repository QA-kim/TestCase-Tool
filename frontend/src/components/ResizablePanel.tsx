import { useState, useRef, useEffect, ReactNode } from 'react'

interface ResizablePanelProps {
  children: ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  side?: 'left' | 'right'
  className?: string
}

export default function ResizablePanel({
  children,
  defaultWidth = 384, // 96 * 4 = 384px (w-96)
  minWidth = 256, // 64 * 4 = 256px (w-64)
  maxWidth = 640, // 160 * 4 = 640px (w-160)
  side = 'right',
  className = ''
}: ResizablePanelProps) {
  const [width, setWidth] = useState(defaultWidth)
  const [isResizing, setIsResizing] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      if (side === 'right') {
        const newWidth = window.innerWidth - e.clientX
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth)
        }
      } else {
        const newWidth = e.clientX
        if (newWidth >= minWidth && newWidth <= maxWidth) {
          setWidth(newWidth)
        }
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing, minWidth, maxWidth, side])

  return (
    <div
      ref={panelRef}
      style={{ width: `${width}px` }}
      className={`relative ${className}`}
    >
      {/* Resize Handle */}
      <div
        onMouseDown={() => setIsResizing(true)}
        className={`absolute top-0 ${
          side === 'right' ? 'left-0 -ml-1' : 'right-0 -mr-1'
        } h-full w-2 cursor-col-resize hover:bg-blue-500/20 transition-colors group`}
      >
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gray-200 group-hover:bg-blue-500 transition-colors" />
      </div>

      {children}
    </div>
  )
}
