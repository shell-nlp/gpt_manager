'use client';

import { useEffect, useState } from 'react';
import { API, Gateway, WorkerUrlStatus } from '@/lib/api';
import { Network, Play, Square, RefreshCw, CheckCircle2, XCircle, AlertCircle, Globe, Shield, Route, Settings2, Terminal, ChevronDown, ChevronUp, Rocket, Zap } from 'lucide-react';

function SectionCard({ title, subtitle, icon: Icon, color, children, action }: {
  title: string;
  subtitle?: string;
  icon: any;
  color: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="card animate-fade-in-up" style={{
      position: 'relative',
      overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${color} 0%, ${color}60 100%)`,
      }} />
      <div style={{
        padding: '1.25rem 1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: collapsed ? 'none' : '1px solid var(--border-subtle)',
        cursor: 'pointer',
        background: 'var(--bg-tertiary)',
        margin: '-0.75rem -0.75rem 0.75rem -0.75rem',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
      }} onClick={() => setCollapsed(!collapsed)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '12px',
            background: `linear-gradient(135deg, ${color} 0%, ${color}90 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 16px ${color}30`,
          }}>
            <Icon size={20} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{subtitle}</p>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {action}
          <button style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            cursor: 'pointer',
            color: 'var(--text-muted)',
            padding: '0.375rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all var(--transition-fast)',
          }}>
            {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
          </button>
        </div>
      </div>
      {!collapsed && (
        <div style={{ padding: '0.5rem 0 0' }}>
          {children}
        </div>
      )}
    </div>
  );
}

function WorkerCard({ status, onRetest }: {
  status: WorkerUrlStatus;
  onRetest: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const isHealthy = status.status === 'healthy';

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${isHealthy ? 'var(--emerald)' : 'var(--rose)'}`,
      borderLeft: `3px solid ${isHealthy ? 'var(--emerald)' : 'var(--rose)'}`,
      overflow: 'hidden',
      transition: 'all var(--transition-fast)',
    }}>
      <div style={{
        padding: '1rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        cursor: 'pointer',
      }} onClick={() => setExpanded(!expanded)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isHealthy ? (
            <CheckCircle2 size={20} style={{ color: 'var(--emerald)' }} />
          ) : (
            <XCircle size={20} style={{ color: 'var(--rose)' }} />
          )}
          <span style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.9rem',
            fontWeight: 600,
          }}>
            {status.url}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className={`badge ${isHealthy ? 'badge-success' : 'badge-danger'}`}>
            {isHealthy ? '健康' : '异常'}
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={(e) => {
              e.stopPropagation();
              onRetest();
            }}
          >
            <RefreshCw size={12} />
          </button>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
      </div>

      {expanded && (
        <div style={{
          padding: '0 1.25rem 1rem',
          borderTop: '1px solid var(--border-subtle)',
        }}>
          {status.error && (
            <div style={{
              marginTop: '1rem',
              padding: '0.875rem',
              background: 'rgba(244, 63, 94, 0.08)',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
            }}>
              <AlertCircle size={16} style={{ color: 'var(--rose)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--rose)', fontWeight: 600 }}>错误信息</p>
                <p style={{ fontSize: '0.85rem', color: 'var(--rose)', marginTop: '0.25rem' }}>{status.error}</p>
              </div>
            </div>
          )}

          {status.models && status.models.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.625rem', fontWeight: 600 }}>
                可用模型 ({status.models.length})
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {status.models.map((model, i) => (
                  <span key={i} style={{
                    padding: '0.375rem 0.75rem',
                    background: 'var(--bg-tertiary)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    fontFamily: 'JetBrains Mono, monospace',
                    border: '1px solid var(--border-subtle)',
                  }}>
                    {model}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', placeholder, required, suffix, options }: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  suffix?: string;
  options?: { value: string; label: string }[];
}) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <label style={{
        display: 'block',
        fontSize: '0.8rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        marginBottom: '0.5rem',
      }}>
        {label}
        {required && <span style={{ color: 'var(--rose)', marginLeft: '2px' }}>*</span>}
      </label>
      {options ? (
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) : e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: '0.875rem 1rem',
            paddingRight: suffix ? '3.5rem' : '1rem',
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            outline: 'none',
          }}
        />
      )}
    </div>
  );
}

export default function GatewayPage() {
  const [gateway, setGateway] = useState<Gateway | null>(null);
  const [workerStatuses, setWorkerStatuses] = useState<WorkerUrlStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    host: '0.0.0.0',
    port: 8082,
    policy: 'cache_aware',
    worker_urls: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const gatewayData = await API.getGateway();
      setGateway(gatewayData);
      setFormData({
        host: gatewayData.host,
        port: gatewayData.port,
        policy: gatewayData.policy,
        worker_urls: gatewayData.worker_urls.join('\n'),
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleTestUrls() {
    setTesting(true);
    try {
      const result = await API.checkWorkerUrls();
      setWorkerStatuses(result.results);
    } catch (err: any) {
      alert('测试失败: ' + err.message);
    } finally {
      setTesting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const urls = formData.worker_urls.split('\n').map((u) => u.trim()).filter(Boolean);
      await API.updateGateway({
        host: formData.host,
        port: parseInt(formData.port as any),
        policy: formData.policy,
        worker_urls: urls,
      } as any);
      alert('保存成功');
      loadData();
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleStartGateway() {
    try {
      await API.startGateway();
      loadData();
    } catch (err: any) {
      alert('启动失败: ' + err.message);
    }
  }

  async function handleStopGateway() {
    try {
      await API.stopGateway();
      loadData();
    } catch (err: any) {
      alert('停止失败: ' + err.message);
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1.5rem',
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.4)',
        animation: 'float 3s ease-in-out infinite',
      }}>
        <Network size={32} color="white" />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>加载网关配置...</p>
    </div>
  );

  if (error) return (
    <div className="card animate-fade-in" style={{
      borderColor: 'var(--rose)',
      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(244, 63, 94, 0.02) 100%)',
      border: '1px solid var(--rose)',
      textAlign: 'center',
      padding: '2rem',
    }}>
      <p style={{ color: 'var(--rose)', fontWeight: 600, fontSize: '1.1rem', marginBottom: '1rem' }}>错误: {error}</p>
      <button className="btn btn-secondary" onClick={loadData}>重试</button>
    </div>
  );

  const isRunning = gateway?.status === 'running';
  const healthyCount = workerStatuses.filter(s => s.status === 'healthy').length;

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div style={{
              padding: '0.375rem 0.875rem',
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.12) 0%, rgba(118, 75, 162, 0.12) 100%)',
              borderRadius: '100px',
              border: '1px solid rgba(102, 126, 234, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              <Route size={12} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary)' }}>网关配置</span>
            </div>
          </div>
          <h2 style={{
            fontSize: '2rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, #1e293b 0%, #667eea 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            网关配置
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            管理 SGL-Model-Gateway 连接池和负载均衡
          </p>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1rem',
        marginBottom: '1.5rem',
      }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: isRunning
                ? 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)'
                : 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
              border: isRunning ? 'none' : '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isRunning ? '0 8px 24px var(--emerald-glow)' : 'none',
            }}>
              <Network size={24} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 500 }}>网关状态</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {isRunning ? '运行中' : '已停止'}
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px var(--blue-glow)',
            }}>
              <Globe size={24} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 500 }}>Worker URLs</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>{gateway?.worker_urls?.length || 0} 个</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '14px',
              background: workerStatuses.length > 0
                ? (healthyCount === workerStatuses.length
                  ? 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)'
                  : 'linear-gradient(135deg, var(--amber) 0%, #d97706 100%)')
                : 'linear-gradient(135deg, var(--violet) 0%, var(--accent-secondary) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: workerStatuses.length > 0 ? '0 8px 24px var(--emerald-glow)' : '0 8px 24px var(--violet-glow)',
            }}>
              <Shield size={24} color="white" />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontWeight: 500 }}>健康检查</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem' }}>
                {workerStatuses.length > 0 ? `${healthyCount} / ${workerStatuses.length}` : '未测试'}
              </p>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isRunning ? (
            <button className="btn" onClick={handleStopGateway} style={{
              flex: 1,
              background: 'linear-gradient(135deg, var(--amber) 0%, #d97706 100%)',
              color: 'white',
              boxShadow: '0 4px 12px var(--amber-glow)',
            }}>
              <Square size={14} />
              停止
            </button>
          ) : (
            <button className="btn" onClick={handleStartGateway} style={{
              flex: 1,
              background: 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)',
              color: 'white',
              boxShadow: '0 4px 12px var(--emerald-glow)',
            }}>
              <Play size={14} />
              启动
            </button>
          )}
          <button
            className="btn btn-secondary"
            onClick={handleTestUrls}
            disabled={testing}
          >
            {testing ? (
              <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            ) : (
              <RefreshCw size={14} />
            )}
          </button>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <SectionCard
          title="基本配置"
          subtitle="网关服务的基本参数"
          icon={Settings2}
          color="var(--blue)"
        >
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
          }}>
            <FormInput
              label="主机地址"
              value={formData.host}
              onChange={(v) => setFormData({ ...formData, host: v })}
              required
            />
            <FormInput
              label="端口"
              value={formData.port}
              onChange={(v) => setFormData({ ...formData, port: v })}
              type="number"
              required
            />
            <FormInput
              label="负载均衡策略"
              value={formData.policy}
              onChange={(v) => setFormData({ ...formData, policy: v })}
              options={[
                { value: 'cache_aware', label: 'Cache Aware' },
                { value: 'round_robin', label: 'Round Robin' },
                { value: 'random', label: 'Random' },
              ]}
              required
            />
          </div>
        </SectionCard>

        <div style={{ marginTop: '1rem' }}>
          <SectionCard
            title="Worker URLs"
            subtitle="配置后端服务地址，每行一个"
            icon={Terminal}
            color="var(--cyan)"
            action={
              <span style={{
                fontSize: '0.7rem',
                padding: '0.25rem 0.625rem',
                background: 'var(--bg-secondary)',
                borderRadius: '9999px',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}>
                {gateway?.worker_urls?.length || 0} 个
              </span>
            }
          >
            <textarea
              value={formData.worker_urls}
              onChange={(e) => setFormData({ ...formData, worker_urls: e.target.value })}
              rows={5}
              placeholder={`http://localhost:30000\nhttp://localhost:30001`}
              style={{
                width: '100%',
                resize: 'vertical',
                padding: '0.875rem 1rem',
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--border-subtle)',
                borderRadius: 'var(--radius-lg)',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: '0.9rem',
                color: 'var(--text-primary)',
                outline: 'none',
                lineHeight: 1.6,
              }}
            />
          </SectionCard>
        </div>

        <div style={{
          display: 'flex',
          gap: '0.875rem',
          marginTop: '1.5rem',
        }}>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '0.875rem 1.5rem' }}>
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
                保存中...
              </span>
            ) : (
              <>
                <Zap size={16} />
                保存配置
              </>
            )}
          </button>
          <button type="button" className="btn btn-secondary" onClick={loadData} style={{ padding: '0.875rem 1.5rem' }}>
            重置
          </button>
        </div>
      </form>

      {workerStatuses.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <SectionCard
            title="Worker URL 健康状态"
            subtitle={`${healthyCount} 个健康 / ${workerStatuses.length} 个总`}
            icon={Shield}
            color={healthyCount === workerStatuses.length ? 'var(--emerald)' : 'var(--amber)'}
          >
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: '0.875rem',
            }}>
              {workerStatuses.map((status, index) => (
                <div
                  key={index}
                  style={{
                    animation: 'fadeInUp 0.4s ease-out forwards',
                    animationDelay: `${index * 60}ms`,
                    opacity: 0,
                  }}
                >
                  <WorkerCard status={status} onRetest={handleTestUrls} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}