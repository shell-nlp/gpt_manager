let currentLogTail = 100;
let workerUrlCheckStatus = {};

async function loadGatewayConfig() {
    try {
        const gatewayData = await API.getGateway();
        const gatewayWorkerUrls = await API.getGatewayWorkerUrls();

        document.getElementById('gw-host').value = gatewayData.host;
        document.getElementById('gw-port').value = gatewayData.port;
        document.getElementById('gw-policy').value = gatewayData.policy;
        document.getElementById('gw-image').value = gatewayData.image;
        document.getElementById('gw-worker-urls').value = (gatewayWorkerUrls.worker_urls || []).join('\n');

        const startBtn = document.getElementById('gateway-start-btn');
        const stopBtn = document.getElementById('gateway-stop-btn');
        const statusBadge = document.getElementById('gateway-status-badge');

        if (gatewayData.status === 'running') {
            startBtn.style.display = 'none';
            stopBtn.style.display = 'inline-block';
            statusBadge.className = 'status-badge status-running';
            statusBadge.textContent = '运行中';
        } else {
            startBtn.style.display = 'inline-block';
            stopBtn.style.display = 'none';
            statusBadge.className = 'status-badge status-stopped';
            statusBadge.textContent = '停止';
        }

        const configInfo = document.getElementById('gateway-config-info');
        configInfo.innerHTML = `
            <p><span class="info-label">状态:</span> ${gatewayData.status}</p>
            <p><span class="info-label">监听地址:</span> ${gatewayData.host}:${gatewayData.port}</p>
            <p><span class="info-label">负载均衡策略:</span> ${gatewayData.policy}</p>
            <p><span class="info-label">Docker镜像:</span> ${gatewayData.image}</p>
        `;

        loadWorkerUrls();

    } catch (error) {
        console.error('Failed to load gateway config:', error);
        showNotification('加载网关配置失败: ' + error.message, 'error');
    }
}

async function loadWorkerUrls() {
    try {
        const gatewayWorkerUrls = await API.getGatewayWorkerUrls();

        const workerUrlsList = document.getElementById('worker-urls-list');
        const urls = gatewayWorkerUrls.worker_urls || [];

        if (urls.length === 0) {
            workerUrlsList.innerHTML = '<p class="empty-message">暂无配置的 Worker URLs</p>';
        } else {
            workerUrlsList.innerHTML = `
                <table class="worker-urls-table">
                    <thead>
                        <tr>
                            <th>URL</th>
                            <th>状态</th>
                            <th>详情</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${urls.map(url => {
                            const status = workerUrlCheckStatus[url] || { status: 'unknown', message: '未测试' };
                            const statusClass = status.status === 'healthy' ? 'status-running' : (status.status === 'error' ? 'status-error' : 'status-stopped');
                            const statusText = status.status === 'healthy' ? '正常' : (status.status === 'error' ? '异常' : '未测试');
                            return `
                                <tr>
                                    <td><code>${url}</code></td>
                                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                                    <td class="status-message">${status.message || ''}</td>
                                    <td><button class="btn btn-small btn-secondary" onclick="checkSingleWorkerUrl('${url}')">测试</button></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
        }

    } catch (error) {
        console.error('Failed to load worker URLs:', error);
        document.getElementById('worker-urls-list').innerHTML = '<p class="error-message">加载 Worker URLs 失败</p>';
    }
}

async function checkSingleWorkerUrl(url) {
    try {
        showNotification(`正在测试 ${url}...`, 'info');
        const response = await fetch(`${url.replace(/\/$/, '')}/v1/models`);
        if (response.ok) {
            workerUrlCheckStatus[url] = { status: 'healthy', message: 'OK' };
            showNotification(`${url} 连接正常`, 'success');
        } else {
            workerUrlCheckStatus[url] = { status: 'error', message: `HTTP ${response.status}` };
            showNotification(`${url} 返回错误: ${response.status}`, 'error');
        }
    } catch (error) {
        workerUrlCheckStatus[url] = { status: 'error', message: error.message };
        showNotification(`${url} 连接失败: ${error.message}`, 'error');
    }
    loadWorkerUrls();
}

async function checkAllWorkerUrls() {
    try {
        showNotification('正在测试所有 Worker URLs...', 'info');
        const result = await API.checkWorkerUrls();

        for (const item of result.results) {
            workerUrlCheckStatus[item.url] = { status: item.status, message: item.message };
        }

        const healthyCount = result.results.filter(r => r.status === 'healthy').length;
        showNotification(`测试完成: ${healthyCount}/${result.results.length} 个正常`, 'success');
        loadWorkerUrls();
    } catch (error) {
        showNotification('测试 Worker URLs 失败: ' + error.message, 'error');
    }
}

async function syncWorkerUrls() {
    try {
        showNotification('正在同步 Worker URLs...', 'info');
        const result = await API.syncWorkerUrls();
        showNotification('同步成功: ' + result.worker_urls.length + ' 个 URL', 'success');
        workerUrlCheckStatus = {};
        loadWorkerUrls();
        loadGatewayConfig();
    } catch (error) {
        showNotification('同步 Worker URLs 失败: ' + error.message, 'error');
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
        workerUrlCheckStatus = {};
        loadGatewayConfig();
        loadWorkerUrls();
    } catch (error) {
        showNotification('保存配置失败: ' + error.message, 'error');
    }
});

async function refreshGatewayLogs() {
    try {
        const logsData = await API.getGatewayLogs(currentLogTail);
        document.getElementById('gateway-logs').textContent = logsData.logs || '暂无日志';
    } catch (error) {
        document.getElementById('gateway-logs').textContent = '加载日志失败: ' + error.message;
    }
}

async function loadMoreLogs() {
    currentLogTail += 100;
    await refreshGatewayLogs();
}

loadGatewayConfig();
