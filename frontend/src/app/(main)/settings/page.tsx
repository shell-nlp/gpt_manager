'use client';

import { useEffect, useState } from 'react';
import { API, Images, DockerInfo, ImageStatus } from '@/lib/api';
import { Settings as SettingsIcon, Image, HardDrive, Cpu, Info, Save, RotateCcw, Box, Monitor, Package, Database, Gauge, CheckCircle2, AlertCircle, Server, Cpu as CpuIcon, Download, Loader2 } from 'lucide-react';

function GlassCard({ children, highlight, accentColor = 'var(--blue)' }: { children: React.ReactNode; highlight?: boolean; accentColor?: string }) {
  return (
    <div className="card animate-fade-in-up" style={{
      position: 'relative',
      overflow: 'hidden',
    }}>
      {highlight && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor} 0%, ${accentColor}60 100%)`,
        }} />
      )}
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        padding: '1.5rem',
        border: `1px solid var(--border-subtle)`,
        boxShadow: 'var(--shadow-sm)',
        transition: 'all var(--transition-base)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {children}
      </div>
    </div>
  );
}

function ImageInputCard({ label, value, onChange, icon: Icon, color, description, isPulled, onPull, pulling }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  icon: any;
  color: string;
  description?: string;
  isPulled?: boolean;
  onPull?: () => void;
  pulling?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="input-card animate-fade-in-up" style={{
      padding: '1.25rem',
      background: isFocused ? 'rgba(102, 126, 234, 0.05)' : 'var(--bg-primary)',
      borderRadius: 'var(--radius-lg)',
      border: `1.5px solid ${isFocused ? color : 'var(--border-subtle)'}`,
      transition: 'all var(--transition-fast)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: 'var(--radius-md)',
          background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 12px ${color}30`,
        }}>
          <Icon size={18} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{label}</label>
          {description && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{description}</p>}
        </div>
        {copied && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            fontSize: '0.7rem',
            color: 'var(--emerald)',
            animation: 'fadeIn 0.2s ease-out',
          }}>
            <CheckCircle2 size={14} />
            已复制
          </span>
        )}
        {isPulled !== undefined && (
          <span style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.375rem',
            padding: '0.375rem 0.75rem',
            background: isPulled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
            borderRadius: 'var(--radius-sm)',
            border: `1px solid ${isPulled ? 'var(--emerald)' : 'var(--amber)'}`,
          }}>
            {isPulled ? (
              <>
                <CheckCircle2 size={14} style={{ color: 'var(--emerald)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 500 }}>已拉取</span>
              </>
            ) : (
              <>
                <AlertCircle size={14} style={{ color: 'var(--amber)' }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--amber)', fontWeight: 500 }}>未拉取</span>
              </>
            )}
          </span>
        )}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            style={{
              width: '100%',
              padding: '0.875rem 3rem 0.875rem 1rem',
              background: 'var(--bg-secondary)',
              border: `1.5px solid ${isFocused ? color : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '0.85rem',
              color: 'var(--text-primary)',
              outline: 'none',
              transition: 'all var(--transition-fast)',
              boxShadow: isFocused ? `0 0 0 3px ${color}15` : 'none',
            }}
            placeholder="请输入镜像地址..."
          />
          <button
            onClick={handleCopy}
            className="copy-btn"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500,
              transition: 'all var(--transition-fast)',
            }}
          >
            复制
          </button>
        </div>
        {onPull && (
          <button
            onClick={onPull}
            disabled={pulling || isPulled}
            className={isPulled ? 'btn' : 'btn btn-primary'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.875rem 1rem',
              whiteSpace: 'nowrap',
            }}
          >
            {pulling ? (
              <>
                <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                拉取中...
              </>
            ) : (
              <>
                <Download size={14} />
                拉取镜像
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, subLabel, delay = 0 }: {
  icon: any;
  label: string;
  value: string | number;
  color: string;
  subLabel?: string;
  delay?: number;
}) {
  return (
    <div
      className="stat-card animate-fade-in-up"
      style={{
        padding: '1.25rem',
        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
        borderRadius: 'var(--radius-lg)',
        border: `1px solid ${color}20`,
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        transition: 'all var(--transition-base)',
        animationDelay: `${delay}ms`,
      }}
    >
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: 'var(--radius-md)',
        background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: `0 4px 12px ${color}30`,
        flexShrink: 0,
      }}>
        <Icon size={20} color="white" />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
          {label}
        </p>
        <p style={{ fontSize: '1.1rem', fontWeight: 700, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-primary)' }}>
          {value}
        </p>
        {subLabel && <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>{subLabel}</p>}
      </div>
    </div>
  );
}

function SystemInfoSection({ dockerInfo }: { dockerInfo: DockerInfo | null }) {
  const items = [
    { icon: Box, label: '运行中的容器', value: dockerInfo?.containers_running || 0, color: 'var(--emerald)' },
    { icon: Server, label: '总容器数', value: dockerInfo?.containers_total || 0, color: 'var(--blue)' },
    { icon: Package, label: 'Docker 镜像', value: dockerInfo?.images_total || 0, color: 'var(--cyan)' },
    { icon: HardDrive, label: '存储驱动', value: dockerInfo?.driver || 'N/A', color: 'var(--violet)' },
    { icon: CpuIcon, label: 'NVIDIA 版本', value: dockerInfo?.nvidia_version || 'N/A', color: 'var(--amber)' },
    { icon: Gauge, label: 'GPU 总内存', value: dockerInfo?.memory_total ? formatBytes(dockerInfo.memory_total) : 'N/A', color: 'var(--rose)' },
  ];

  return (
    <div className="animate-fade-in-up" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: 'var(--radius-lg)',
          background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px var(--blue-glow)',
        }}>
          <Monitor size={20} color="white" />
        </div>
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>系统信息</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Docker 和 GPU 状态概览</p>
        </div>
      </div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
      }}>
        {items.map((item, index) => (
          <StatCard
            key={index}
            icon={item.icon}
            label={item.label}
            value={item.value}
            color={item.color}
            delay={index * 50}
          />
        ))}
      </div>
    </div>
  );
}

function InfoBanner({ message, type = 'info' }: { message: string; type?: 'info' | 'warning' }) {
  const colors = type === 'info'
    ? { bg: 'rgba(59, 130, 246, 0.08)', border: 'var(--blue)', icon: Info }
    : { bg: 'rgba(245, 158, 11, 0.08)', border: 'var(--amber)', icon: AlertCircle };

  const Icon = colors.icon;

  return (
    <div style={{
      marginTop: '1.25rem',
      padding: '1rem 1.25rem',
      background: colors.bg,
      borderRadius: 'var(--radius-md)',
      border: `1px solid ${colors.border}30`,
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
    }}>
      <Icon size={16} style={{ color: colors.border, flexShrink: 0, marginTop: '2px' }} />
      <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
        {message}
      </p>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function SettingsPage() {
  const [images, setImages] = useState<Images | null>(null);
  const [imageStatus, setImageStatus] = useState<ImageStatus | null>(null);
  const [dockerInfo, setDockerInfo] = useState<DockerInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pullingTasks, setPullingTasks] = useState<Record<string, { taskId: string; status: string; progress: string }>>({});

  const [formData, setFormData] = useState({
    sglang_image: '',
    vllm_image: '',
    gateway_image: '',
    pull_registry: '',
  });

  useEffect(() => {
    loadData();
    restorePullingTasks();
  }, []);

  async function restorePullingTasks() {
    try {
      const { tasks } = await API.listPullTasks();
      if (tasks && tasks.length > 0) {
        const restored: Record<string, { taskId: string; status: string; progress: string }> = {};
        for (const task of tasks) {
          restored[task.image] = {
            taskId: task.id,
            status: task.status,
            progress: task.progress,
          };
        }
        setPullingTasks(restored);
      }
    } catch (err) {
      console.error('Failed to restore pulling tasks:', err);
    }
  }

  useEffect(() => {
    const pollInterval = setInterval(async () => {
      if (Object.keys(pullingTasks).length === 0) return;

      const updatedTasks = { ...pullingTasks };
      let hasChanges = false;

      for (const [image, task] of Object.entries(pullingTasks)) {
        if (task.status === 'pulling' || task.status === 'pending') {
          try {
            const status = await API.getPullTaskStatus(task.taskId);
            if (status.status !== task.status || status.progress !== task.progress) {
              updatedTasks[image] = {
                taskId: task.taskId,
                status: status.status,
                progress: status.progress,
              };
              hasChanges = true;
            }
            if (status.status === 'completed' || status.status === 'failed') {
              setTimeout(() => {
                loadData();
                setPullingTasks(prev => {
                  const next = { ...prev };
                  delete next[image];
                  return next;
                });
              }, 1000);
            }
          } catch (err) {
            console.error('Failed to poll task status:', err);
          }
        }
      }

      if (hasChanges) {
        setPullingTasks(updatedTasks);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [pullingTasks]);

  async function loadData() {
    setLoading(true);
    try {
      const [imagesData, dockerData, statusData, dockerConfigData] = await Promise.all([
        API.getImages(),
        API.getDockerInfo(),
        API.getImageStatus(),
        API.getDockerConfig(),
      ]);
      setImages(imagesData);
      setDockerInfo(dockerData);
      setImageStatus(statusData);
      setFormData({
        sglang_image: imagesData.sglang_image,
        vllm_image: imagesData.vllm_image,
        gateway_image: imagesData.gateway_image,
        pull_registry: dockerConfigData.pull_registry || '',
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePullImage(image: string) {
    try {
      const result = await API.pullImage(image);
      setPullingTasks(prev => ({
        ...prev,
        [image]: { taskId: result.task_id, status: 'pulling', progress: '开始拉取...' },
      }));
    } catch (err: any) {
      alert('拉取镜像失败: ' + err.message);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        API.updateImages({
          sglang_image: formData.sglang_image,
          vllm_image: formData.vllm_image,
          gateway_image: formData.gateway_image,
        }),
        API.updateDockerConfig({
          pull_registry: formData.pull_registry,
        }),
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadData();
    } catch (err: any) {
      alert('保存失败: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '400px',
      gap: '1.25rem',
    }}>
      <div className="loading-icon">
        <SettingsIcon size={28} color="white" />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>加载系统设置...</p>
    </div>
  );

  if (error) return (
    <div className="card" style={{
      padding: '2rem',
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--rose)',
      textAlign: 'center',
    }}>
      <AlertCircle size={48} style={{ color: 'var(--rose)', marginBottom: '1rem' }} />
      <p style={{ color: 'var(--rose)', fontWeight: 500, marginBottom: '1.5rem' }}>错误: {error}</p>
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
          <h2 style={{
            fontSize: '1.75rem',
            fontWeight: 700,
            marginBottom: '0.5rem',
            background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            系统设置
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            配置 Docker 镜像和环境参数
          </p>
        </div>
        {saveSuccess && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.625rem 1rem',
            background: 'rgba(16, 185, 129, 0.1)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--emerald)',
            animation: 'fadeIn 0.3s ease-out',
          }}>
            <CheckCircle2 size={16} style={{ color: 'var(--emerald)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--emerald)', fontWeight: 500 }}>
              保存成功
            </span>
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        <GlassCard highlight accentColor="var(--blue)">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.75rem' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-lg)',
              background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 16px var(--blue-glow)',
            }}>
              <Image size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Docker 镜像配置</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>设置模型服务和网关使用的 Docker 镜像</p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: '1rem' }}>
            <ImageInputCard
              label="SGLang 镜像"
              value={formData.sglang_image}
              onChange={(v) => setFormData({ ...formData, sglang_image: v })}
              icon={Box}
              color="var(--blue)"
              description="用于启动 SGLang 推理服务"
              isPulled={imageStatus?.sglang_image_pulled}
              onPull={() => handlePullImage(formData.sglang_image)}
              pulling={!!pullingTasks[formData.sglang_image]}
            />
            <ImageInputCard
              label="vLLM 镜像"
              value={formData.vllm_image}
              onChange={(v) => setFormData({ ...formData, vllm_image: v })}
              icon={Database}
              color="var(--emerald)"
              description="用于启动 vLLM 推理服务"
              isPulled={imageStatus?.vllm_image_pulled}
              onPull={() => handlePullImage(formData.vllm_image)}
              pulling={!!pullingTasks[formData.vllm_image]}
            />
            <ImageInputCard
              label="Gateway 镜像"
              value={formData.gateway_image}
              onChange={(v) => setFormData({ ...formData, gateway_image: v })}
              icon={SettingsIcon}
              color="var(--violet)"
              description="用于启动 SGL-Model-Gateway"
              isPulled={imageStatus?.gateway_image_pulled}
              onPull={() => handlePullImage(formData.gateway_image)}
              pulling={!!pullingTasks[formData.gateway_image]}
            />
          </div>

          <div style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.75rem' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--violet) 0%, var(--purple) 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Download size={18} color="white" />
              </div>
              <div>
                <label style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>拉取镜像源</label>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.125rem' }}>配置镜像拉取的代理/镜像源</p>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={formData.pull_registry}
                onChange={(e) => setFormData({ ...formData, pull_registry: e.target.value })}
                placeholder="例如: docker.1ms.run"
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  paddingLeft: '2.75rem',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  outline: 'none',
                  transition: 'all var(--transition-fast)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--violet)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border-subtle)'}
              />
              <span style={{
                position: 'absolute',
                left: '0.875rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
              }}>
                /
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              配置后将使用 <code style={{ background: 'var(--bg-secondary)', padding: '0.125rem 0.375rem', borderRadius: '4px' }}>{formData.pull_registry || '镜像源'}/镜像名</code> 格式拉取镜像
            </p>
          </div>

          <InfoBanner message="镜像配置修改后，新启动的模型服务将使用新的镜像地址。正在运行的服务不受影响。" />

          <div style={{
            display: 'flex',
            gap: '0.75rem',
            marginTop: '1.75rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid var(--border-subtle)',
          }}>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '0.875rem 1.75rem',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>⟳</span>
                  保存中...
                </span>
              ) : (
                <>
                  <Save size={16} />
                  保存设置
                </>
              )}
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={loadData}
              style={{ padding: '0.875rem 1.75rem' }}
            >
              <RotateCcw size={16} />
              重置
            </button>
          </div>
        </GlassCard>
      </form>

      <SystemInfoSection dockerInfo={dockerInfo} />
    </div>
  );
}