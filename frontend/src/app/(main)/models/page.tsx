'use client';

import { useEffect, useState } from 'react';
import { API, Model, Backend } from '@/lib/api';
import { Plus, Box, Play, Square, Trash2, Server, Cpu, Gauge, Layers, X, Brain, Sparkles, Search, ArrowRight, Rocket } from 'lucide-react';

function FloatingInput({ label, value, onChange, type = 'text', placeholder, required, icon: Icon, suffix }: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  icon?: any;
  suffix?: string;
}) {
  return (
    <div style={{ position: 'relative', marginBottom: '1.25rem' }}>
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
      <div style={{ position: 'relative' }}>
        {Icon && (
          <div style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            zIndex: 1,
          }}>
            <Icon size={18} />
          </div>
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(type === 'number' ? parseInt(e.target.value) : e.target.value)}
          placeholder={placeholder}
          required={required}
          style={{
            width: '100%',
            padding: Icon ? '0.875rem 1rem 0.875rem 2.75rem' : '0.875rem 1rem',
            paddingRight: suffix ? '3.5rem' : '1rem',
            background: 'var(--bg-primary)',
            border: '1.5px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            fontSize: '0.9rem',
            color: 'var(--text-primary)',
            transition: 'all var(--transition-fast)',
            outline: 'none',
          }}
          onFocus={(e) => {
            e.target.style.borderColor = 'var(--accent-primary)';
            e.target.style.boxShadow = '0 0 0 4px var(--accent-glow)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = 'var(--border-subtle)';
            e.target.style.boxShadow = 'none';
          }}
        />
        {suffix && (
          <span style={{
            position: 'absolute',
            right: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            fontWeight: 500,
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function ModelCard({ model, onStart, onStop, onDelete }: {
  model: Model;
  onStart: () => void;
  onStop: () => void;
  onDelete: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const isRunning = model.status === 'running';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="card"
      style={{
        border: `1px solid ${isHovered ? 'var(--border-accent)' : 'var(--border-subtle)'}`,
        transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: isRunning
          ? 'linear-gradient(90deg, var(--emerald) 0%, var(--cyan) 50%, var(--accent-primary) 100%)'
          : 'linear-gradient(90deg, var(--text-muted) 0%, var(--border-strong) 100%)',
        transition: 'all var(--transition-base)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem', marginTop: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '16px',
            background: isRunning
              ? 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)'
              : 'linear-gradient(135deg, var(--bg-tertiary) 0%, var(--bg-secondary) 100%)',
            border: isRunning ? 'none' : '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isRunning ? '0 8px 24px var(--emerald-glow)' : 'none',
            transition: 'all var(--transition-base)',
            transform: isHovered ? 'scale(1.08) rotate(-3deg)' : 'scale(1)',
          }}>
            <Brain size={28} color={isRunning ? "white" : "var(--text-muted)"} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem' }}>{model.name}</h3>
            <span className={`badge ${isRunning ? 'badge-success' : 'badge-warning'}`}>
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'currentColor',
                display: 'inline-block',
                boxShadow: isRunning ? '0 0 8px var(--emerald)' : 'none',
              }} />
              {isRunning ? '运行中' : '已停止'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {isRunning ? (
            <button
              className="btn btn-sm"
              onClick={onStop}
              style={{
                background: 'linear-gradient(135deg, var(--amber) 0%, #d97706 100%)',
                color: 'white',
                boxShadow: '0 4px 12px var(--amber-glow)',
              }}
            >
              <Square size={13} />
              停止
            </button>
          ) : (
            <button
              className="btn btn-sm"
              onClick={onStart}
              style={{
                background: 'linear-gradient(135deg, var(--emerald) 0%, #059669 100%)',
                color: 'white',
                boxShadow: '0 4px 12px var(--emerald-glow)',
              }}
            >
              <Play size={13} />
              启动
            </button>
          )}
          <button
            className="btn btn-sm btn-secondary"
            onClick={onDelete}
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '0.75rem',
        padding: '1rem',
        background: 'var(--bg-tertiary)',
        borderRadius: 'var(--radius-lg)',
        marginBottom: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Server size={15} style={{ color: 'var(--blue)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>后端</p>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{model.backend_type}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Cpu size={15} style={{ color: 'var(--violet)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>GPU</p>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{model.gpu_ids?.join(', ') || 'N/A'}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Layers size={15} style={{ color: 'var(--cyan)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>张量并行</p>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{model.tensor_parallel || 1}</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '10px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Gauge size={15} style={{ color: 'var(--rose)' }} />
          </div>
          <div>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.1rem' }}>端口</p>
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)' }}>{model.host}:{model.port}</p>
          </div>
        </div>
      </div>

      <div style={{
        padding: '0.875rem 1rem',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)',
      }}>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 500 }}>
          <span>模型路径</span>
        </p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
          {model.model_path}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 500 }}>
          <span>服务名称</span>
        </p>
        <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: 'var(--accent-primary)' }}>
          {model.served_model_name}
        </p>
      </div>
    </div>
  );
}

function CreateModal({ backends, onSubmit, onClose, submitting }: {
  backends: Backend[];
  onSubmit: (data: any) => void;
  onClose: () => void;
  submitting: boolean;
}) {
  const [formData, setFormData] = useState({
    name: '',
    backend_type: backends[0]?.value || 'sglang',
    model_path: '',
    served_model_name: '',
    host: '0.0.0.0',
    port: 30000,
    tensor_parallel: 1,
    gpu_ids: '0',
  });

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-2xl)',
          width: '100%',
          maxWidth: '540px',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 32px 64px rgba(0, 0, 0, 0.2)',
          animation: 'fadeInScale 0.3s ease-out',
        }}
      >
        <div style={{
          padding: '1.75rem 2rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
            }}>
              <Rocket size={24} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>创建新模型</h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>配置模型服务参数</p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit({
            ...formData,
            gpu_ids: formData.gpu_ids.split(',').map((id) => parseInt(id.trim())),
          });
        }} style={{ padding: '1.75rem 2rem 2rem' }}>
          <FloatingInput
            label="模型名称"
            value={formData.name}
            onChange={(v) => setFormData({ ...formData, name: v })}
            placeholder="例如: Qwen-7B-Chat"
            required
            icon={Brain}
          />

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: '0.625rem',
            }}>
              后端类型 <span style={{ color: 'var(--rose)', marginLeft: '2px' }}>*</span>
            </label>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              {backends.map((b) => (
                <button
                  key={b.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, backend_type: b.value })}
                  style={{
                    flex: 1,
                    padding: '0.875rem 1rem',
                    borderRadius: 'var(--radius-lg)',
                    border: `2px solid ${formData.backend_type === b.value ? 'var(--accent-primary)' : 'var(--border-subtle)'}`,
                    background: formData.backend_type === b.value
                      ? 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.05) 100%)'
                      : 'var(--bg-primary)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <div style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: formData.backend_type === b.value ? 'var(--accent-primary)' : 'var(--text-muted)',
                    boxShadow: formData.backend_type === b.value ? '0 0 12px var(--accent-primary)' : 'none',
                    transition: 'all var(--transition-fast)',
                  }} />
                  <span style={{
                    fontWeight: 600,
                    fontSize: '0.9rem',
                    color: formData.backend_type === b.value ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}>
                    {b.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <FloatingInput
            label="模型路径"
            value={formData.model_path}
            onChange={(v) => setFormData({ ...formData, model_path: v })}
            placeholder="/models/Qwen-7B-Chat"
            required
            icon={Box}
          />

          <FloatingInput
            label="服务名称"
            value={formData.served_model_name}
            onChange={(v) => setFormData({ ...formData, served_model_name: v })}
            placeholder="qwen7b"
            required
            icon={Sparkles}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FloatingInput
              label="主机"
              value={formData.host}
              onChange={(v) => setFormData({ ...formData, host: v })}
              required
            />
            <FloatingInput
              label="端口"
              value={formData.port}
              onChange={(v) => setFormData({ ...formData, port: v })}
              type="number"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FloatingInput
              label="张量并行"
              value={formData.tensor_parallel}
              onChange={(v) => setFormData({ ...formData, tensor_parallel: v })}
              type="number"
              suffix="GPU"
            />
            <FloatingInput
              label="GPU IDs"
              value={formData.gpu_ids}
              onChange={(v) => setFormData({ ...formData, gpu_ids: v })}
              placeholder="0,1,2,3"
            />
          </div>

          <div style={{
            display: 'flex',
            gap: '0.875rem',
            marginTop: '2rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '0.875rem' }}
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{
                flex: 1,
                padding: '0.875rem',
                opacity: submitting ? 0.7 : 1,
              }}
            >
              {submitting ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  创建中...
                </span>
              ) : (
                <>
                  <Plus size={16} />
                  创建模型
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [backends, setBackends] = useState<Backend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [modelsRes, backendsRes] = await Promise.all([
        API.listModels(),
        API.getBackends(),
      ]);
      setModels(modelsRes.models);
      setBackends(backendsRes.backends);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(formData: any) {
    setSubmitting(true);
    try {
      await API.createModel(formData as any);
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('创建失败: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStart(id: string) {
    try {
      await API.startModel(id);
      loadData();
    } catch (err: any) {
      alert('启动失败: ' + err.message);
    }
  }

  async function handleStop(id: string) {
    try {
      await API.stopModel(id);
      loadData();
    } catch (err: any) {
      alert('停止失败: ' + err.message);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这个模型吗？')) return;
    try {
      await API.deleteModel(id);
      loadData();
    } catch (err: any) {
      alert('删除失败: ' + err.message);
    }
  }

  const runningCount = models.filter(m => m.status === 'running').length;
  const filteredModels = models.filter(m =>
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.model_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.backend_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <Brain size={32} color="white" />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>加载模型数据...</p>
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
              <Brain size={12} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary)' }}>模型管理</span>
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
            模型管理
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            共 {models.length} 个模型 | <span style={{ color: 'var(--emerald)', fontWeight: 600 }}>{runningCount}</span> 个运行中
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => setShowModal(true)}
          style={{ padding: '0.875rem 1.5rem' }}
        >
          <Plus size={18} />
          创建新模型
        </button>
      </div>

      {models.length > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.875rem',
          padding: '1rem 1.25rem',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
        }}>
          <Search size={20} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索模型名称、路径或后端类型..."
            style={{
              flex: 1,
              border: 'none',
              background: 'transparent',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              outline: 'none',
            }}
          />
        </div>
      )}

      {models.length === 0 ? (
        <div className="card animate-fade-in-up" style={{
          textAlign: 'center',
          padding: '5rem 2rem',
        }}>
          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 2rem',
            boxShadow: '0 16px 48px rgba(102, 126, 234, 0.35)',
          }}>
            <Brain size={48} color="white" />
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem' }}>暂无模型</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', maxWidth: '400px', margin: '0 auto 2rem', lineHeight: 1.6 }}>
            点击下方按钮创建您的第一个模型，开始使用 SGLang 或 vLLM 推理服务
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
            style={{ padding: '1rem 2rem' }}
          >
            <Rocket size={18} />
            创建新模型
          </button>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="card animate-fade-in" style={{
          textAlign: 'center',
          padding: '4rem 2rem',
        }}>
          <Search size={48} style={{ color: 'var(--text-muted)', marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>未找到匹配 " {searchQuery} " 的模型</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
          gap: '1.5rem',
        }}>
          {filteredModels.map((model, index) => (
            <div
              key={model.id}
              style={{
                animation: 'fadeInUp 0.5s ease-out forwards',
                animationDelay: `${index * 60}ms`,
                opacity: 0,
              }}
            >
              <ModelCard
                model={model}
                onStart={() => handleStart(model.id)}
                onStop={() => handleStop(model.id)}
                onDelete={() => handleDelete(model.id)}
              />
            </div>
          ))}
        </div>
      )}

      {showModal && backends.length > 0 && (
        <CreateModal
          backends={backends}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
          submitting={submitting}
        />
      )}
    </div>
  );
}