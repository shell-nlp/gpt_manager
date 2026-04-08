async function refreshDashboard() {
    try {
        const [dockerInfo, modelsData, gatewayData] = await Promise.all([
            API.getDockerInfo(),
            API.listModels(),
            API.getGateway(),
        ]);

        const runningModels = modelsData.models.filter(m => m.status === 'running').length;
        const stoppedModels = modelsData.models.filter(m => m.status === 'stopped').length;

        document.getElementById('running-models').textContent = runningModels;
        document.getElementById('stopped-models').textContent = stoppedModels;
        document.getElementById('gateway-status').textContent = gatewayData.status || 'Unknown';
        document.getElementById('docker-containers').textContent = dockerInfo.containers_running || 0;

        const runningModelsList = document.getElementById('running-models-list');
        if (runningModels === 0) {
            runningModelsList.innerHTML = '<p class="loading">暂无运行中的模型</p>';
        } else {
            runningModelsList.innerHTML = modelsData.models
                .filter(m => m.status === 'running')
                .map(m => `
                    <div class="model-card">
                        <h4>${m.name}</h4>
                        <div class="model-info">
                            <p><strong>类型:</strong> ${m.backend_type}</p>
                            <p><strong>地址:</strong> ${m.host}:${m.port}</p>
                            <p><strong>模型:</strong> ${m.served_model_name}</p>
                        </div>
                        <span class="model-status running">运行中</span>
                    </div>
                `).join('');
        }

        const gatewayInfo = document.getElementById('gateway-info');
        gatewayInfo.innerHTML = `
            <p><span class="info-label">状态:</span> ${gatewayData.status}</p>
            <p><span class="info-label">地址:</span> ${gatewayData.host}:${gatewayData.port}</p>
            <p><span class="info-label">策略:</span> ${gatewayData.policy}</p>
            <p><span class="info-label">Worker URLs:</span> ${gatewayData.worker_urls.length} 个</p>
            <p><span class="info-label">镜像:</span> ${gatewayData.image}</p>
        `;

    } catch (error) {
        console.error('Failed to refresh dashboard:', error);
        showNotification('刷新失败: ' + error.message, 'error');
    }
}

async function startAllModels() {
    try {
        showNotification('正在启动所有模型...', 'info');
        const modelsData = await API.listModels();
        for (const model of modelsData.models) {
            if (model.status !== 'running') {
                await API.startModel(model.id);
            }
        }
        showNotification('所有模型启动完成', 'success');
        refreshDashboard();
    } catch (error) {
        showNotification('启动失败: ' + error.message, 'error');
    }
}

async function stopAllModels() {
    try {
        showNotification('正在停止所有模型...', 'info');
        const modelsData = await API.listModels();
        for (const model of modelsData.models) {
            if (model.status === 'running') {
                await API.stopModel(model.id);
            }
        }
        showNotification('所有模型已停止', 'success');
        refreshDashboard();
    } catch (error) {
        showNotification('停止失败: ' + error.message, 'error');
    }
}

async function restartGateway() {
    try {
        showNotification('正在重启网关...', 'info');
        await API.restartGateway();
        showNotification('网关重启完成', 'success');
        refreshDashboard();
    } catch (error) {
        showNotification('重启失败: ' + error.message, 'error');
    }
}

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

    refreshDashboard();

    setInterval(refreshDashboard, 30000);
});
