'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Box, Network, Settings, Sparkles, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';

const navItems = [
  { href: '/', label: '仪表盘', icon: LayoutDashboard },
  { href: '/models', label: '模型管理', icon: Box },
  { href: '/gateway', label: '网关配置', icon: Network },
  { href: '/settings', label: '系统设置', icon: Settings },
];

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{
        width: '260px',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 100,
        boxShadow: '2px 0 8px rgba(0, 0, 0, 0.04)',
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px var(--blue-glow)',
            }}>
              <Sparkles size={22} color="white" />
            </div>
            <div>
              <h1 style={{
                fontSize: '1.15rem',
                fontWeight: 700,
                background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 1.2,
              }}>
                SGL-Gateway
              </h1>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                模型管理平台
              </p>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: '1rem 0.75rem' }}>
          <p style={{
            fontSize: '0.65rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            padding: '0 0.75rem',
            marginBottom: '0.5rem',
          }}>
            导航菜单
          </p>
          {navItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.75rem 1rem',
                  marginBottom: '0.25rem',
                  borderRadius: 'var(--radius-md)',
                  color: isActive ? 'var(--blue)' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(6, 182, 212, 0.05) 100%)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.15)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all var(--transition-fast)',
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateX(0)' : 'translateX(-10px)',
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: isActive ? 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)' : 'var(--bg-tertiary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all var(--transition-fast)',
                  }}>
                    <Icon size={16} color={isActive ? 'white' : 'var(--text-muted)'} />
                  </div>
                  <span style={{ fontWeight: isActive ? 600 : 500, fontSize: '0.9rem' }}>{item.label}</span>
                </div>
                {isActive && (
                  <ChevronRight size={16} style={{ color: 'var(--blue)' }} />
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{
          padding: '1rem 1.25rem',
          borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-tertiary)',
        }}>
          <div style={{
            padding: '0.75rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-xs)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--emerald)',
                boxShadow: '0 0 8px var(--emerald-glow)',
              }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-secondary)' }}>系统正常</span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
              版本 v1.0.0
            </p>
          </div>
        </div>
      </aside>

      <main style={{
        flex: 1,
        marginLeft: '260px',
        minHeight: '100vh',
        background: 'var(--bg-primary)',
        position: 'relative',
      }}>
        <div style={{
          position: 'sticky',
          top: 0,
          height: '64px',
          background: 'rgba(248, 250, 252, 0.9)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          zIndex: 50,
        }}>
          <div>
            <h2 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {navItems.find(item => item.href === pathname)?.label || '仪表盘'}
            </h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-xs)',
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'var(--emerald)',
                boxShadow: '0 0 6px var(--emerald-glow)',
              }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>在线</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '2rem' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
