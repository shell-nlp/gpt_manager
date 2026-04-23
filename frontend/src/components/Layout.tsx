'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, Network, Settings, ChevronRight, Sparkles } from 'lucide-react';

const navItems = [
  { href: '/', label: '首页', icon: LayoutDashboard },
  { href: '/models', label: '模型管理', icon: Box },
  { href: '/gateway', label: '网关配置', icon: Network },
  { href: '/settings', label: '设置', icon: Settings },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg-primary)' }}>
      <header style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '72px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: '44px',
                height: '44px',
                position: 'relative',
              }}>
                <svg viewBox="0 0 44 44" width="44" height="44" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#667eea" />
                      <stop offset="50%" stopColor="#764ba2" />
                      <stop offset="100%" stopColor="#f093fb" />
                    </linearGradient>
                    <linearGradient id="logoGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                    <filter id="logoGlow" x="-50%" y="-50%" width="200%" height="200%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>
                  <polygon points="22,2 40,12 40,32 22,42 4,32 4,12" fill="url(#logoGradient)" filter="url(#logoGlow)" />
                  <polygon points="22,8 34,15 34,29 22,36 10,29 10,15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
                  <polygon points="22,14 28,18 28,26 22,30 16,26 16,18" fill="rgba(255,255,255,0.2)" />
                  <circle cx="22" cy="22" r="3" fill="white" />
                </svg>
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'white',
                  boxShadow: '0 0 10px white, 0 0 20px rgba(255,255,255,0.5)',
                  animation: 'core-pulse 2s ease-in-out infinite',
                }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
              <h1 style={{
                margin: 0,
                fontSize: '1.15rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#1e293b',
                lineHeight: 1.2,
              }}>
                SGL-Model-Gateway
              </h1>
              <p style={{
                margin: 0,
                fontSize: '0.7rem',
                color: 'var(--text-secondary)',
                letterSpacing: '0.02em',
                fontWeight: 500,
              }}>
                智能模型网关管理平台
              </p>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: '0.375rem', background: 'var(--bg-tertiary)', padding: '0.375rem', borderRadius: '12px' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.625rem 1.125rem',
                    borderRadius: '8px',
                    color: isActive ? 'white' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.875rem',
                    background: isActive ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent',
                    boxShadow: isActive ? '0 2px 8px rgba(102, 126, 234, 0.35)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                >
                  <Icon size={16} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: 'var(--emerald)',
              boxShadow: '0 0 12px var(--emerald)',
              animation: 'pulse-glow 2s ease-in-out infinite',
            }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 500 }}>系统正常</span>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {children}
        </div>
      </main>

      <footer style={{
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '1.25rem 2rem',
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            &copy; 2024 SGL-Model-Gateway Manager. 智能模型部署与管理平台.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <span>Made with</span>
            <div style={{
              width: '16px',
              height: '16px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #48dbfb 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Sparkles size={10} color="white" />
            </div>
            <span>for AI</span>
          </div>
        </div>
      </footer>
    </div>
  );
}