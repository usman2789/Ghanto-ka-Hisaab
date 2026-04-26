'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { gsap } from 'gsap'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface MenuItem {
  label: string
  href?: string
  onClick?: () => void
}

interface StaggeredMenuProps {
  items: MenuItem[]
  position?: 'left' | 'right'
  colors?: string[]
  menuButtonColor?: string
  accentColor?: string
}

export default function StaggeredMenu({
  items,
  position = 'right',
  colors = ['#18181b', '#27272a', '#3f3f46'],
  menuButtonColor = '#18181b',
  accentColor = '#18181b'
}: StaggeredMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const overlayRefs = useRef<HTMLDivElement[]>([])
  const menuItemsRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const prevPathname = useRef(pathname)

  // Handle menu animations
  useEffect(() => {
    if (isOpen) {
      // Animate overlays in with stagger
      gsap.to(overlayRefs.current, {
        x: 0,
        duration: 0.3,
        stagger: 0.05,
        ease: 'power3.out'
      })
      // Animate menu items
      if (menuItemsRef.current) {
        gsap.fromTo(
          menuItemsRef.current.children,
          { y: 50, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.24, stagger: 0.05, delay: 0.12, ease: 'power2.out' }
        )
      }
    } else {
      // Animate overlays out
      gsap.to(overlayRefs.current, {
        x: position === 'right' ? '100%' : '-100%',
        duration: 0.24,
        stagger: { each: 0.03, from: 'end' },
        ease: 'power3.in'
      })
    }
  }, [isOpen, position])

  // Close menu only when pathname actually changes (not on initial mount)
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      setIsOpen(false)
      prevPathname.current = pathname
    }
  }, [pathname])

  // Close on click outside (but not on the button)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        menuRef.current && 
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      // Use setTimeout to avoid immediate trigger
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside)
      }, 100)
      return () => {
        clearTimeout(timer)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const toggleMenu = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  return (
    <>
      {/* Menu Button */}
      <button
        ref={buttonRef}
        onClick={toggleMenu}
        className="absolute top-4 left-4 z-[60] p-3 rounded-lg border-2 border-zinc-900 bg-white shadow-[4px_4px_0_0_#323232] hover:shadow-[2px_2px_0_0_#323232] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        aria-label="Toggle menu"
      >
        <div className="w-6 h-5 flex flex-col justify-between">
          <span
            className={`block h-0.5 w-full bg-zinc-900 transition-all duration-300 origin-center ${
              isOpen ? 'rotate-45 translate-y-[9px]' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-zinc-900 transition-all duration-300 ${
              isOpen ? 'opacity-0 scale-0' : ''
            }`}
          />
          <span
            className={`block h-0.5 w-full bg-zinc-900 transition-all duration-300 origin-center ${
              isOpen ? '-rotate-45 -translate-y-[9px]' : ''
            }`}
          />
        </div>
      </button>

      {/* Menu Panel */}
      <div 
        ref={menuRef} 
        className={`fixed inset-0 z-50 ${isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'}`}
        style={{ display: isOpen ? 'block' : 'none' }}
      >
        {/* Staggered Overlay Layers */}
        {colors.map((color, index) => (
          <div
            key={index}
            ref={(el) => {
              if (el) overlayRefs.current[index] = el
            }}
            className={`absolute inset-0 ${position === 'right' ? 'translate-x-full' : '-translate-x-full'}`}
            style={{
              backgroundColor: color,
              zIndex: 50 + index,
              willChange: 'transform'
            }}
          />
        ))}

        {/* Menu Content */}
        <div
          className={`absolute inset-0 flex flex-col justify-center px-8 md:px-16 ${
            isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
          }`}
          style={{ zIndex: 50 + colors.length }}
        >
          <nav ref={menuItemsRef} className="space-y-2">
            {items.map((item, index) => {
              const isActive = item.href === pathname
              
              if (item.href) {
                return (
                  <Link
                    key={index}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`block group ${isOpen ? 'visible' : 'invisible'}`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-zinc-500 text-sm font-mono w-8">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span
                        className={`text-3xl md:text-5xl font-bold transition-colors duration-200 ${
                          isActive
                            ? 'text-white'
                            : 'text-zinc-400 group-hover:text-white'
                        }`}
                        style={{ 
                          textShadow: isActive ? `0 0 20px ${accentColor}` : 'none'
                        }}
                      >
                        {item.label}
                      </span>
                      {isActive && (
                        <span className="text-white text-sm">●</span>
                      )}
                    </div>
                  </Link>
                )
              }
              
              return (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick?.()
                    setIsOpen(false)
                  }}
                  className={`block group text-left ${isOpen ? 'visible' : 'invisible'}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-zinc-500 text-sm font-mono w-8">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="text-3xl md:text-5xl font-bold text-zinc-400 group-hover:text-white transition-colors duration-200">
                      {item.label}
                    </span>
                  </div>
                </button>
              )
            })}
          </nav>

          {/* Footer */}
          <div className={`mt-12 pt-8 border-t border-zinc-700 ${isOpen ? 'visible opacity-100' : 'invisible opacity-0'} transition-opacity duration-300 delay-500`}>
            <p className="text-zinc-500 text-sm">
              © 2025 Ghanto ka Hisaab
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
