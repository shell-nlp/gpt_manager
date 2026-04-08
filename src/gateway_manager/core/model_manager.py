from typing import Dict, List, Optional, Any
from datetime import datetime
import logging
import uuid

from gateway_manager.models.schemas import (
    InferenceBackendType,
    BaseModelConfig,
    SGLangConfig,
    ModelInstance,
    ContainerStatus,
    AppConfig,
)
from gateway_manager.core.docker_manager import DockerManager
from gateway_manager.core.backend_manager import BackendManagerFactory

logger = logging.getLogger(__name__)


class ModelManager:
    def __init__(self, app_config: AppConfig):
        self.app_config = app_config
        self.docker_manager = DockerManager()
        self.models: Dict[str, ModelInstance] = {}

    def _generate_model_id(self) -> str:
        return f"model-{uuid.uuid4().hex[:8]}"

    def create_model(
        self,
        name: str,
        backend_type: InferenceBackendType,
        model_path: str,
        served_model_name: str,
        host: str = "0.0.0.0",
        port: int = 30000,
        tensor_parallel: int = 1,
        gpu_ids: Optional[List[int]] = None,
        image: Optional[str] = None,
        **kwargs,
    ) -> ModelInstance:
        model_id = self._generate_model_id()
        container_name = f"sglang-{port}"

        if gpu_ids is None:
            gpu_ids = [0]

        base_config = BaseModelConfig(
            model_path=model_path,
            served_model_name=served_model_name,
            host=host,
            port=port,
            tensor_parallel=tensor_parallel,
            gpu_ids=gpu_ids,
        )

        if backend_type == InferenceBackendType.SGLANG:
            config = SGLangConfig(**base_config.model_dump(), **{k: v for k, v in kwargs.items() if v is not None})
        else:
            config = base_config

        final_image = image or self._get_default_image(backend_type)

        model = ModelInstance(
            id=model_id,
            name=name,
            backend_type=backend_type,
            config=config,
            container_name=container_name,
            image=final_image,
            status=ContainerStatus.STOPPED,
        )

        self.models[model_id] = model
        logger.info(f"模型 {name} (ID: {model_id}) 创建成功")
        return model

    def _get_default_image(self, backend_type: InferenceBackendType) -> str:
        images = {
            InferenceBackendType.SGLANG: self.app_config.sglang_image,
            InferenceBackendType.VLLM: self.app_config.vllm_image,
            InferenceBackendType.LMDEPLOY: self.app_config.lmdeploy_image,
            InferenceBackendType.TABBY: self.app_config.tabby_image,
            InferenceBackendType.OPENVINO: self.app_config.openvino_image,
        }
        return images.get(backend_type, self.app_config.sglang_image)

    def start_model(self, model_id: str) -> bool:
        model = self.models.get(model_id)
        if model is None:
            logger.error(f"模型 {model_id} 不存在")
            return False

        try:
            manager = BackendManagerFactory.create_manager(
                model.backend_type,
                model.config,
                model.image,
            )

            container = self.docker_manager.create_container(
                name=model.container_name,
                image=model.image,
                command=manager.build_command(),
                ports=manager.build_ports(),
                volumes=manager.build_volumes(),
                environment=manager.build_environment(),
                shm_size=manager.get_shm_size(),
                gpu_ids=manager.get_gpu_ids(),
            )

            if container:
                model.container_id = container.id
                model.status = ContainerStatus.RUNNING
                logger.info(f"模型 {model.name} 启动成功")
                return True

            model.status = ContainerStatus.ERROR
            return False

        except Exception as e:
            logger.error(f"启动模型 {model.name} 失败: {e}")
            model.status = ContainerStatus.ERROR
            return False

    def stop_model(self, model_id: str) -> bool:
        model = self.models.get(model_id)
        if model is None:
            logger.error(f"模型 {model_id} 不存在")
            return False

        if self.docker_manager.stop_container(model.container_name):
            model.status = ContainerStatus.STOPPED
            logger.info(f"模型 {model.name} 停止成功")
            return True

        return False

    def restart_model(self, model_id: str) -> bool:
        model = self.models.get(model_id)
        if model is None:
            logger.error(f"模型 {model_id} 不存在")
            return False

        self.stop_model(model_id)
        return self.start_model(model_id)

    def delete_model(self, model_id: str, force: bool = False) -> bool:
        model = self.models.get(model_id)
        if model is None:
            logger.error(f"模型 {model_id} 不存在")
            return False

        self.docker_manager.stop_container(model.container_name)
        if self.docker_manager.remove_container(model.container_name, force=force):
            del self.models[model_id]
            logger.info(f"模型 {model.name} 删除成功")
            return True

        return False

    def get_model(self, model_id: str) -> Optional[ModelInstance]:
        model = self.models.get(model_id)
        if model:
            model.status = self.docker_manager.get_container_status(model.container_name)
        return model

    def list_models(self) -> List[ModelInstance]:
        for model in self.models.values():
            model.status = self.docker_manager.get_container_status(model.container_name)
        return list(self.models.values())

    def get_model_logs(self, model_id: str, tail: int = 100) -> Optional[str]:
        model = self.models.get(model_id)
        if model is None:
            return None

        return self.docker_manager.get_container_logs(model.container_name, tail)

    def update_model_config(self, model_id: str, **kwargs) -> bool:
        model = self.models.get(model_id)
        if model is None:
            logger.error(f"模型 {model_id} 不存在")
            return False

        if "image" in kwargs:
            model.image = kwargs["image"]

        logger.info(f"模型 {model.name} 配置更新成功")
        return True

    def get_worker_urls(self) -> List[str]:
        urls = []
        for model in self.models.values():
            if model.status == ContainerStatus.RUNNING:
                port = model.config.port
                host = model.config.host
                if host == "0.0.0.0":
                    import socket
                    host = socket.gethostbyname(socket.gethostname())
                urls.append(f"http://{host}:{port}")
        return urls

    def load_models_from_config(self, config: Dict[str, Any]) -> int:
        loaded = 0
        for model_data in config.get("models", []):
            try:
                model = self.create_model(
                    name=model_data["name"],
                    backend_type=InferenceBackendType(model_data.get("backend_type", "sglang")),
                    model_path=model_data["model_path"],
                    served_model_name=model_data["served_model_name"],
                    host=model_data.get("host", "0.0.0.0"),
                    port=model_data.get("port", 30000),
                    tensor_parallel=model_data.get("tensor_parallel", 1),
                    gpu_ids=model_data.get("gpu_ids", [0]),
                    image=model_data.get("image"),
                )
                loaded += 1
            except Exception as e:
                logger.error(f"加载模型配置失败: {e}")

        return loaded

    def export_models_config(self) -> Dict[str, Any]:
        models_config = []
        for model in self.models.values():
            models_config.append({
                "name": model.name,
                "backend_type": model.backend_type.value,
                "model_path": model.config.model_path,
                "served_model_name": model.config.served_model_name,
                "host": model.config.host,
                "port": model.config.port,
                "tensor_parallel": model.config.tensor_parallel,
                "gpu_ids": model.config.gpu_ids,
                "image": model.image,
                "status": model.status.value,
            })

        return {"models": models_config}
