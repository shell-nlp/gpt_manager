let currentLogTail = 100;

async function loadGatewayConfig() {
    try {
        const gatewayData = await API.getGateway();
        const workerUrlsData = await API.getWorkerUrls();

        document.getElementById('gw-host').value = gatewayData.host;
        document.getElementById('gw-port').value = gatewayData.port;
        document.getElementById('gw-policy').value = gatewayData.policy;
        document.getElementById('gw-image').value = gatewayData.image;

        const workerUrls = workerUrlsData.worker_urls || gatewayData.worker_urls || [];
        document.getElementById('gw-worker-urls').value = workerUrls.join('\n');

        const startBtn = document.getElementById('gateway-start-btn');
        const stopBtn = document.getElementById('gateway-stop-btn');

        if (gatewayData.status === 'running') {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
        }

        const configInfo = document.getElementById('gateway-config-info');
        configInfo.innerHTML = `
            <p><span class="info-label">状态:</span> ${gatewayData.status}</p>
            <p><span class="info-label">监听地址:</span> ${gatewayData.host}:${gatewayData.port}</p>
            <p><span class="info-label">负载均衡策略:</span> ${gatewayData.policy}</p>
            <p><span class="info-label">Docker镜像:</span> ${gatewayData.image}</p>
            <p><span class="info-label">Worker URLs:</span></p>
            <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                ${workerUrls.map(url => `<li>${url}</li>`).join('')}
            </ul>
        `;

    } catch (error) {
        console.error('Failed to load gateway config:', error);
        showNotification('加载网关配置失败: ' + error.message, 'error');
    }
}

async function startGateway() {
    try {
        showNotification('正在启动网关...', 'info');
        await API.startGateway();
        showNotification('网关启动成功', 'success');
        loadGatewayConfig();
    } catch (error) {
        showNotification('启动网关失败: ' + error.message, 'error');
    }
}

async function stopGateway() {
    try {
        showNotification('正在停止网关...', 'info');
        await API.stopGateway();
        showNotification('网关已停止', 'success');
        loadGatewayConfig();
    } catch (error) {
        showNotification('停止网关失败: ' + error.message, 'error');
    }
}

async function restartGateway() {
    try {
        showNotification('正在重启网关...', 'info');
        await API.restartGateway();
        showNotification('网关重启成功', 'success');
        loadGatewayConfig();
        refreshGatewayLogs();
    } catch (error) {
        showNotification('重启网关失败: ' + error.message, 'error');
    }
}

document.getElementById('gateway-config-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const workerUrlsText = formData.get('worker_urls');
    const workerUrls = workerUrlsText.split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);

    const data = {
        host: formData.get('host'),
        port: parseInt(formData.get('port')),
        policy: formData.get('policy'),
        image: formData.get('image'),
        worker_urls: workerUrls,
    };

    try {
        showNotification('正在保存配置...', 'info');
        await API.updateGateway(data);
        showNotification('配置保存成功', 'success');
        loadGatewayConfig();
    } catch (error) {
        showNotification('保存配置失败: ' + error.message, 'error');
    }
});

async function refreshGatewayLogs() {
    try {
        const data = await API.getGatewayLogs(currentLogTail);
        document.getElementById('gateway-logs').textContent = data.logs || '暂无日志';
    } catch (error) {
        document.getElementById('gateway-logs').textContent = '获取日志失败: ' + error.message;
    }
}

async function loadMoreLogs() {
    currentLogTail += 100;
    await refreshGatewayLogs();
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

    loadGatewayConfig();
    refreshGatewayLogs();
});
