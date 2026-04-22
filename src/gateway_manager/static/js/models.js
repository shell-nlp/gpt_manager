let currentModelId = null;
console.log('models.js loaded');

async function loadBackendTypes() {
    try {
        const select = document.getElementById('backend-type');
        if (!select) {
            console.error('backend-type select not found');
            return;
        }
        console.log('Loading backend types...');
        const data = await API.getBackends();
        console.log('Backend types received:', data);
        select.innerHTML = '';
        for (const backend of data.backends) {
            const option = document.createElement('option');
            option.value = backend.value;
            option.textContent = backend.label;
            select.appendChild(option);
        }
        console.log('Backend types loaded successfully');
    } catch (error) {
        console.error('Failed to load backend types:', error);
    }
}

function initPage() {
    loadBackendTypes();
    loadModels();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

async function loadModels() {
    try {
        const data = await API.listModels();
        const container = document.getElementById('models-container');

        if (data.models.length === 0) {
            container.innerHTML = '<p class="loading">暂无模型，请点击"创建新模型"按钮添加</p>';
            return;
        }

        container.innerHTML = data.models.map(model => `
            <div class="model-card">
                <h4>${model.name}</h4>
                <div class="model-info">
                    <p><strong>类型:</strong> ${model.backend_type}</p>
                    <p><strong>路径:</strong> ${model.model_path}</p>
                    <p><strong>服务名:</strong> ${model.served_model_name}</p>
                    <p><strong>地址:</strong> ${model.host}:${model.port}</p>
                    <p><strong>GPU:</strong> ${model.gpu_ids.join(', ')}</p>
                    <p><strong>镜像:</strong> ${model.image}</p>
                </div>
                <span class="model-status ${model.status}">${model.status === 'running' ? '运行中' : model.status === 'stopped' ? '已停止' : '错误'}</span>
                <div class="model-actions">
                    ${model.status === 'running' ? `
                        <button class="btn btn-danger btn-small" onclick="stopModel('${model.id}')">停止</button>
                        <button class="btn btn-warning btn-small" onclick="restartModel('${model.id}')">重启</button>
                    ` : `
                        <button class="btn btn-success btn-small" onclick="startModel('${model.id}')">启动</button>
                    `}
                    <button class="btn btn-secondary btn-small" onclick="showModelDetail('${model.id}')">详情</button>
                    <button class="btn btn-secondary btn-small" onclick="showModelLogs('${model.id}')">日志</button>
                    <button class="btn btn-danger btn-small" onclick="deleteModel('${model.id}')">删除</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        console.error('Failed to load models:', error);
        document.getElementById('models-container').innerHTML =
            '<p class="loading">加载失败: ' + error.message + '</p>';
    }
}

async function startModel(id) {
    try {
        showNotification('正在启动模型...', 'info');
        await API.startModel(id);
        showNotification('模型启动成功', 'success');
        loadModels();
    } catch (error) {
        showNotification('启动失败: ' + error.message, 'error');
    }
}

async function stopModel(id) {
    try {
        showNotification('正在停止模型...', 'info');
        await API.stopModel(id);
        showNotification('模型已停止', 'success');
        loadModels();
    } catch (error) {
        showNotification('停止失败: ' + error.message, 'error');
    }
}

async function restartModel(id) {
    try {
        showNotification('正在重启模型...', 'info');
        await API.restartModel(id);
        showNotification('模型重启成功', 'success');
        loadModels();
    } catch (error) {
        showNotification('重启失败: ' + error.message, 'error');
    }
}

async function deleteModel(id) {
    if (!confirm('确定要删除这个模型吗？')) {
        return;
    }

    try {
        await API.deleteModel(id);
        showNotification('模型已删除', 'success');
        loadModels();
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    }
}

async function showModelDetail(id) {
    currentModelId = id;
    try {
        const model = await API.getModel(id);
        const content = document.getElementById('model-detail-content');

        content.innerHTML = `
            <div class="detail-grid">
                <div class="detail-item">
                    <label>ID</label>
                    <span>${model.id}</span>
                </div>
                <div class="detail-item">
                    <label>名称</label>
                    <span>${model.name}</span>
                </div>
                <div class="detail-item">
                    <label>后端类型</label>
                    <span>${model.backend_type}</span>
                </div>
                <div class="detail-item">
                    <label>状态</label>
                    <span class="model-status ${model.status}">${model.status}</span>
                </div>
                <div class="detail-item">
                    <label>模型路径</label>
                    <span>${model.model_path}</span>
                </div>
                <div class="detail-item">
                    <label>服务模型名</label>
                    <span>${model.served_model_name}</span>
                </div>
                <div class="detail-item">
                    <label>监听地址</label>
                    <span>${model.host}</span>
                </div>
                <div class="detail-item">
                    <label>端口</label>
                    <span>${model.port}</span>
                </div>
                <div class="detail-item">
                    <label>张量并行</label>
                    <span>${model.tensor_parallel}</span>
                </div>
                <div class="detail-item">
                    <label>GPU IDs</label>
                    <span>${model.gpu_ids.join(', ')}</span>
                </div>
                <div class="detail-item">
                    <label>容器名称</label>
                    <span>${model.container_name}</span>
                </div>
                <div class="detail-item">
                    <label>Docker镜像</label>
                    <span>${model.image}</span>
                </div>
            </div>
        `;

        openModal('model-detail-modal');
    } catch (error) {
        showNotification('加载详情失败: ' + error.message, 'error');
    }
}

async function showModelLogs(id) {
    try {
        const data = await API.getModelLogs(id);
        alert(data.logs || '暂无日志');
    } catch (error) {
        showNotification('获取日志失败: ' + error.message, 'error');
    }
}

async function refreshModelDetail() {
    if (currentModelId) {
        await showModelDetail(currentModelId);
    }
}

function showCreateModelModal() {
    document.getElementById('create-model-form').reset();
    openModal('create-model-modal');
}

async function updateFormFields() {
    // This function is kept for future use if needed
}

document.getElementById('create-model-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const gpuIdsStr = formData.get('gpu_ids');

    const data = {
        name: formData.get('name'),
        backend_type: formData.get('backend_type'),
        model_path: formData.get('model_path'),
        served_model_name: formData.get('served_model_name'),
        host: formData.get('host'),
        port: parseInt(formData.get('port')),
        tensor_parallel: parseInt(formData.get('tensor_parallel')),
    };

    if (gpuIdsStr) {
        data.gpu_ids = gpuIdsStr.split(',').map(id => parseInt(id.trim()));
    }

    try {
        showNotification('正在创建模型...', 'info');
        await API.createModel(data);
        showNotification('模型创建成功', 'success');
        closeModal('create-model-modal');
        loadModels();
    } catch (error) {
        showNotification('创建失败: ' + error.message, 'error');
    }
});

function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
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
});
