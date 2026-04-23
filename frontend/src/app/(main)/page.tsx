'use client';

import { useEffect, useState } from 'react';
import { API, DockerInfo, ImageStatus } from '@/lib/api';
import { Container, Image, HardDrive, Cpu, Activity, Server, Zap, Clock, RefreshCw, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Download, Loader2, Box, Database, Settings as SettingsIcon } from 'lucide-react';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function StatCard({ icon: Icon, label, value, subValue, color, accent, delay }: {
  icon: any;
  label: string;
  value: string | number;
  subValue?: string;
  color: string;
  accent: string;
  delay: number;
}) {
  return (
    <div
      className="card animate-fade-in-up"
      style={{
        animationDelay: `${delay}ms`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '-60px',
        right: '-60px',
        width: '140px',
        height: '140px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${accent}20 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '3px',
        background: `linear-gradient(90deg, ${accent} 0%, ${color}50 100%)`,
        opacity: 0.6,
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
        <div style={{ flex: 1 }}>
          <p style={{
            fontSize: '0.7rem',
            fontWeight: 600,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '0.5rem',
          }}>{label}</p>
          <p style={{
            fontSize: '2rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${color} 0%, ${accent} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            lineHeight: 1.2,
          }}>{value}</p>
          {subValue && (
            <p style={{
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.375rem',
            }}>
              <span style={{
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                background: color,
              }} />
              {subValue}
            </p>
          )}
        </div>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: `linear-gradient(135deg, ${color}15 0%, ${accent}08 100%)`,
          border: `1px solid ${accent}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 4px 16px ${accent}15`,
        }}>
          <Icon size={26} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function DefaultImageCard({ name, image, isPulled, pullingTasks, onPull, color }: {
  name: string;
  image: string;
  isPulled?: boolean;
  pullingTasks?: Record<string, { status: string; progress: string }>;
  onPull?: () => void;
  color: string;
}) {
  const task = pullingTasks?.[image];
  const isPulling = !!task;
  const progress = task?.progress || '';

  return (
    <div style={{
      padding: '1.25rem',
      background: 'var(--bg-tertiary)',
      borderRadius: 'var(--radius-lg)',
      border: `1px solid ${isPulled ? 'var(--border-subtle)' : 'var(--amber)'}40`,
      transition: 'all var(--transition-base)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: `linear-gradient(135deg, ${color} 0%, ${color}88 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {name === 'SGLang' && <Box size={18} color="white" />}
            {name === 'vLLM' && <Database size={18} color="white" />}
            {name === 'Gateway' && <SettingsIcon size={18} color="white" />}
          </div>
          <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{name} 镜像</span>
        </div>
        <span style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          padding: '0.25rem 0.625rem',
          background: isPulled ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
          borderRadius: '100px',
          border: `1px solid ${isPulled ? 'var(--emerald)' : 'var(--amber)'}`,
        }}>
          {isPulled ? (
            <>
              <CheckCircle2 size={12} style={{ color: 'var(--emerald)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--emerald)', fontWeight: 500 }}>已拉取</span>
            </>
          ) : (
            <>
              <AlertCircle size={12} style={{ color: 'var(--amber)' }} />
              <span style={{ fontSize: '0.7rem', color: 'var(--amber)', fontWeight: 500 }}>未拉取</span>
            </>
          )}
        </span>
      </div>
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono, monospace',
        marginBottom: '0.5rem',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {image}
      </p>
      {isPulling && (
        <p style={{
          fontSize: '0.7rem',
          color: 'var(--blue)',
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
        }}>
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          {progress || '拉取中...'}
        </p>
      )}
      <button
        onClick={onPull}
        disabled={isPulling || isPulled || !image}
        className={isPulled ? 'btn' : 'btn btn-primary'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%',
          padding: '0.625rem 1rem',
        }}
      >
        {isPulling ? (
          <>
            <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            拉取中...
          </>
        ) : isPulled ? (
          '已就绪'
        ) : (
          <>
            <Download size={14} />
            拉取镜像
          </>
        )}
      </button>
    </div>
  );
}

export default function HomePage() {
  const [dockerInfo, setDockerInfo] = useState<DockerInfo | null>(null);
  const [imageStatus, setImageStatus] = useState<ImageStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [pullingTasks, setPullingTasks] = useState<Record<string, { taskId: string; status: string; progress: string }>>({});

  useEffect(() => {
    loadData();
    restorePullingTasks();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
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
    if (Object.keys(pullingTasks).length === 0) return;

    const pollInterval = setInterval(async () => {
      for (const [image, task] of Object.entries(pullingTasks)) {
        if (task.status === 'pulling' || task.status === 'pending') {
          try {
            const status = await API.getPullTaskStatus(task.taskId);
            if (status.status === 'completed' || status.status === 'failed') {
              setPullingTasks(prev => {
                const next = { ...prev };
                delete next[image];
                return next;
              });
              loadData();
            }
          } catch (err) {
            console.error('Failed to poll task status:', err);
          }
        }
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [pullingTasks]);

  async function loadData() {
    try {
      const [dockerData, statusData] = await Promise.all([
        API.getDockerInfo(),
        API.getImageStatus(),
      ]);
      setDockerInfo(dockerData);
      setImageStatus(statusData);
      setLastUpdate(new Date());
      setError('');
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

  async function handlePullAll() {
    if (!imageStatus) return;
    if (!imageStatus.sglang_image_pulled && imageStatus.sglang_image) {
      await handlePullImage(imageStatus.sglang_image);
    }
    if (!imageStatus.vllm_image_pulled && imageStatus.vllm_image) {
      await handlePullImage(imageStatus.vllm_image);
    }
    if (!imageStatus.gateway_image_pulled && imageStatus.gateway_image) {
      await handlePullImage(imageStatus.gateway_image);
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
        <Sparkles size={32} color="white" />
      </div>
      <p style={{ color: 'var(--text-muted)', fontSize: '1rem', fontWeight: 500 }}>加载系统信息...</p>
    </div>
  );

  if (error) return (
    <div className="card animate-fade-in" style={{
      borderColor: 'var(--rose)',
      background: 'linear-gradient(135deg, rgba(244, 63, 94, 0.05) 0%, rgba(244, 63, 94, 0.02) 100%)',
      border: '1px solid var(--rose)',
    }}>
      <p style={{ color: 'var(--rose)', fontWeight: 600, fontSize: '1.1rem' }}>错误: {error}</p>
      <button className="btn btn-secondary" onClick={loadData} style={{ marginTop: '1rem' }}>
        <RefreshCw size={14} /> 重试
      </button>
    </div>
  );

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2.5rem',
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
              <Activity size={12} style={{ color: 'var(--accent-primary)' }} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-primary)' }}>实时监控</span>
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
            系统概览
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            监控 Docker 容器和系统资源状态
          </p>
        </div>
        {lastUpdate && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1.25rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'var(--shadow-sm)',
          }}>
            <Clock size={16} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              最后更新: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{lastUpdate.toLocaleTimeString()}</span>
            </span>
            <button onClick={loadData} className="btn btn-sm btn-secondary" style={{ marginLeft: '0.25rem' }}>
              <RefreshCw size={12} />
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        <StatCard
          icon={Container}
          label="运行中的容器"
          value={dockerInfo?.containers_running || 0}
          subValue={`共 ${dockerInfo?.containers_total || 0} 个容器`}
          color="var(--emerald)"
          accent="#10b981"
          delay={0}
        />
        <StatCard
          icon={Image}
          label="Docker 镜像"
          value={dockerInfo?.images_total || 0}
          subValue="已下载到本地"
          color="var(--blue)"
          accent="#3b82f6"
          delay={100}
        />
        <StatCard
          icon={HardDrive}
          label="存储驱动"
          value={dockerInfo?.driver || 'N/A'}
          subValue="Docker 存储驱动"
          color="var(--violet)"
          accent="#8b5cf6"
          delay={200}
        />
        <StatCard
          icon={Cpu}
          label="GPU 内存"
          value={formatBytes(dockerInfo?.memory_total || 0)}
          subValue={`NVIDIA ${dockerInfo?.nvidia_version || 'N/A'}`}
          color="var(--amber)"
          accent="#f59e0b"
          delay={300}
        />
      </div>

      <div className="card animate-fade-in-up" style={{
        marginTop: '2rem',
        animationDelay: '400ms',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '300px',
          height: '300px',
          background: 'radial-gradient(circle, rgba(102, 126, 234, 0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', position: 'relative' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.35)',
          }}>
            <Activity size={26} color="white" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.25rem' }}>系统状态</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>实时健康监控 · 所有服务运行正常</p>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <span className="badge badge-success">
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--emerald)',
                boxShadow: '0 0 12px var(--emerald)',
                animation: 'pulse-glow 2s ease-in-out infinite',
              }} />
              运行正常
            </span>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          position: 'relative',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            transition: 'all var(--transition-base)',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Server size={22} style={{ color: 'var(--emerald)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>容器状态</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {dockerInfo?.containers_running || 0}
                <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.9rem' }}> / {dockerInfo?.containers_total || 0}</span>
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            transition: 'all var(--transition-base)',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Zap size={22} style={{ color: 'var(--amber)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>NVIDIA 驱动</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {dockerInfo?.nvidia_version || 'N/A'}
              </p>
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-subtle)',
            transition: 'all var(--transition-base)',
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <HardDrive size={22} style={{ color: 'var(--violet)' }} />
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>存储驱动</p>
              <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                {dockerInfo?.driver || 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="card animate-fade-in-up" style={{
        marginTop: '2rem',
        animationDelay: '500ms',
        position: 'relative',
        overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, var(--blue) 0%, var(--cyan) 100%)',
        }} />
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '200px',
          height: '200px',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, var(--blue) 0%, var(--cyan) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 16px rgba(59, 130, 246, 0.3)',
          }}>
            <Box size={22} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.25rem' }}>默认镜像状态</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>检查并拉取必要的 Docker 镜像</p>
          </div>
          {!imageStatus?.sglang_image_pulled || !imageStatus?.vllm_image_pulled || !imageStatus?.gateway_image_pulled ? (
            <button
              onClick={handlePullAll}
              disabled={Object.keys(pullingTasks).length > 0}
              className="btn btn-primary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.625rem 1.25rem',
              }}
            >
              {Object.keys(pullingTasks).length > 0 ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                  拉取中...
                </>
              ) : (
                <>
                  <Download size={14} />
                  一键拉取全部
                </>
              )}
            </button>
          ) : null}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}>
          <DefaultImageCard
            name="SGLang"
            image={imageStatus?.sglang_image || ''}
            isPulled={imageStatus?.sglang_image_pulled}
            pullingTasks={pullingTasks}
            onPull={() => imageStatus?.sglang_image && handlePullImage(imageStatus.sglang_image)}
            color="var(--blue)"
          />
          <DefaultImageCard
            name="vLLM"
            image={imageStatus?.vllm_image || ''}
            isPulled={imageStatus?.vllm_image_pulled}
            pullingTasks={pullingTasks}
            onPull={() => imageStatus?.vllm_image && handlePullImage(imageStatus.vllm_image)}
            color="var(--emerald)"
          />
          <DefaultImageCard
            name="Gateway"
            image={imageStatus?.gateway_image || ''}
            isPulled={imageStatus?.gateway_image_pulled}
            pullingTasks={pullingTasks}
            onPull={() => imageStatus?.gateway_image && handlePullImage(imageStatus.gateway_image)}
            color="var(--violet)"
          />
        </div>
      </div>

      <div style={{
        marginTop: '2rem',
        padding: '1.5rem',
        background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08) 0%, rgba(118, 75, 162, 0.05) 100%)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid rgba(102, 126, 234, 0.15)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        animation: 'fadeIn 0.6s ease-out forwards',
        animationDelay: '600ms',
        opacity: 0,
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '14px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(102, 126, 234, 0.3)',
          flexShrink: 0,
        }}>
          <Sparkles size={24} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            SGL-Model-Gateway 管理平台
          </p>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            提供便捷的模型部署与管理体验，支持多种后端引擎和智能路由策略
          </p>
        </div>
        <a
          href="/models"
          className="btn btn-primary"
          style={{ flexShrink: 0, textDecoration: 'none' }}
        >
          管理模型
          <ArrowRight size={16} />
        </a>
      </div>
    </div>
  );
}