async function loadSettings() {
    try {
        const imagesData = await API.getImages();
        const dockerInfo = await API.getDockerInfo();

        const sglangImageEl = document.getElementById('sglang-image');
        const vllmImageEl = document.getElementById('vllm-image');
        const gatewayImageEl = document.getElementById('gateway-image');

        if (sglangImageEl) sglangImageEl.value = imagesData.sglang_image || '';
        if (vllmImageEl) vllmImageEl.value = imagesData.vllm_image || '';
        if (gatewayImageEl) gatewayImageEl.value = imagesData.gateway_image || '';

        const dockerInfoEl = document.getElementById('docker-info');
        if (dockerInfoEl) {
            dockerInfoEl.innerHTML = `
                <p><span class="info-label">运行中的容器:</span> ${dockerInfo.containers_running || 0}</p>
                <p><span class="info-label">总容器数:</span> ${dockerInfo.containers_total || 0}</p>
                <p><span class="info-label">镜像数:</span> ${dockerInfo.images_total || 0}</p>
                <p><span class="info-label">存储驱动:</span> ${dockerInfo.driver || 'N/A'}</p>
                <p><span class="info-label">NVIDIA版本:</span> ${dockerInfo.nvidia_version || 'N/A'}</p>
                <p><span class="info-label">总内存:</span> ${formatBytes(dockerInfo.memory_total || 0)}</p>
            `;
        }

    } catch (error) {
        console.error('Failed to load settings:', error);
        showNotification('加载设置失败: ' + error.message, 'error');
    }
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

document.getElementById('images-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    showNotification('设置已保存（注意：需要重启应用使部分设置生效）', 'success');
});

async function exportConfig() {
    try {
        const [modelsData, gatewayData, imagesData] = await Promise.all([
            API.listModels(),
            API.getGateway(),
            API.getImages(),
        ]);

        const config = {
            models: modelsData.models.map(m => ({
                name: m.name,
                backend_type: m.backend_type,
                model_path: m.model_path,
                served_model_name: m.served_model_name,
                host: m.host,
                port: m.port,
                tensor_parallel: m.tensor_parallel,
                gpu_ids: m.gpu_ids,
                image: m.image,
            })),
            gateway: {
                host: gatewayData.host,
                port: gatewayData.port,
                policy: gatewayData.policy,
                image: gatewayData.image,
                worker_urls: gatewayData.worker_urls,
            },
            images: imagesData,
        };

        const blob = new Blob([YAML.stringify(config)], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gateway-config-${new Date().toISOString().slice(0, 10)}.yaml`;
        a.click();
        URL.revokeObjectURL(url);

        showNotification('配置导出成功', 'success');
    } catch (error) {
        console.error('Failed to export config:', error);
        showNotification('导出失败: ' + error.message, 'error');
    }
}

async function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const text = await file.text();
        const config = YAML.parse(text);

        if (config.models) {
            for (const model of config.models) {
                try {
                    await API.createModel(model);
                } catch (e) {
                    console.warn(`Failed to create model ${model.name}:`, e);
                }
            }
        }

        if (config.gateway) {
            await API.updateGateway(config.gateway);
        }

        showNotification('配置导入成功', 'success');
        loadSettings();
    } catch (error) {
        console.error('Failed to import config:', error);
        showNotification('导入失败: ' + error.message, 'error');
    }

    event.target.value = '';
}

const YAML = {
    stringify: function(obj) {
        const lines = [];

        if (obj.images) {
            lines.push('# Docker Images');
            for (const [key, value] of Object.entries(obj.images)) {
                lines.push(`${key}: ${value}`);
            }
            lines.push('');
        }

        if (obj.gateway) {
            lines.push('# Gateway Configuration');
            lines.push('gateway:');
            for (const [key, value] of Object.entries(obj.gateway)) {
                if (Array.isArray(value)) {
                    lines.push(`  ${key}:`);
                    value.forEach(v => lines.push(`    - ${v}`));
                } else {
                    lines.push(`  ${key}: ${value}`);
                }
            }
            lines.push('');
        }

        if (obj.models) {
            lines.push('# Models Configuration');
            lines.push('models:');
            for (const model of obj.models) {
                lines.push('  - name: ' + model.name);
                lines.push('    backend_type: ' + model.backend_type);
                lines.push('    model_path: ' + model.model_path);
                lines.push('    served_model_name: ' + model.served_model_name);
                lines.push('    host: ' + model.host);
                lines.push('    port: ' + model.port);
                lines.push('    tensor_parallel: ' + model.tensor_parallel);
                lines.push('    gpu_ids: [' + model.gpu_ids.join(', ') + ']');
                if (model.image) {
                    lines.push('    image: ' + model.image);
                }
            }
        }

        return lines.join('\n');
    },

    parse: function(text) {
        const result = {};
        const lines = text.split('\n');
        let currentSection = null;
        let currentModel = null;

        for (let line of lines) {
            line = line.trim();
            if (!line || line.startsWith('#')) continue;

            if (line === 'gateway:') {
                currentSection = 'gateway';
                result.gateway = {};
                continue;
            }

            if (line === 'models:') {
                currentSection = 'models';
                result.models = [];
                continue;
            }

            if (line.startsWith('images:')) {
                currentSection = 'images';
                result.images = {};
                continue;
            }

            if (currentSection === 'images' && line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                result.images[key.trim()] = valueParts.join(':').trim();
                continue;
            }

            if (currentSection === 'gateway') {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                if (key.startsWith('  ')) {
                    result.gateway[key.trim()] = value;
                }
                continue;
            }

            if (currentSection === 'models' && line.startsWith('- name:')) {
                if (currentModel) {
                    result.models.push(currentModel);
                }
                currentModel = { name: line.replace('- name:', '').trim() };
                continue;
            }

            if (currentModel && line.includes(':')) {
                const [key, ...valueParts] = line.split(':');
                const value = valueParts.join(':').trim();
                if (!key.startsWith('-')) {
                    if (key === 'gpu_ids') {
                        currentModel[key.trim()] = value.replace(/[\[\]]/g, '').split(',').map(s => s.trim());
                    } else {
                        currentModel[key.trim()] = value;
                    }
                }
            }
        }

        if (currentModel) {
            result.models.push(currentModel);
        }

        return result;
    }
};

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 6px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;

    if (type === 'success') {
        notification.style.backgroundColor = '#16a34a';
    } else if (type === 'error') {
        notification.style.backgroundColor = '#dc2626';
    } else {
        notification.style.backgroundColor = '#2563eb';
    }

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        @keyframes slideOut {
            from { transform: translateX(0); opacity: 1; }
            to { transform: translateX(100%); opacity: 0; }
        }
    `;
    document.head.appendChild(style);

    loadSettings();
});
