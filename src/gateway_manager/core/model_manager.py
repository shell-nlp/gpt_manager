from typing import Dict, List, Optional, Any
import uuid
import socket
from loguru import logger

from gateway_manager.models.schemas import (
    InferenceBackendType,
    BaseModelConfig,
    SGLangConfig,
    VLLMConfig,
    ModelInstance,
    ContainerStatus,
)
from gateway_manager.core.docker_manager import DockerManager
from gateway_manager.core.backend_manager import BackendManagerFactory
from gateway_manager.core.config_manager import ConfigManager
from gateway_manager.core.constants import DEFAULT_IMAGES


class ModelManager:
    def __init__(self, config_manager: ConfigManager):
        self.config_manager = config_manager
        self.docker_manager = DockerManager()
        self.models: Dict[str, ModelInstance] = {}
        self._load_models()

    def _generate_model_id(self) -> str:
        return f"model-{uuid.uuid4().hex[:8]}"

    def _load_models(self) -> None:
        config = self.config_manager.load()
        models_config = config.get("models", [])
        for model_data in models_config:
            try:
                model = self._create_model_from_config(model_data)
                self.models[model.id] = model
            except Exception as e:
                logger.error(f"加载模型配置失败: {model_data.get('name', 'unknown')}: {e}")

    def _create_model_from_config(self, model_data: Dict[str, Any]) -> ModelInstance:
        model_id = model_data.get("id", self._generate_model_id())
        container_name = model_data.get("container_name", f"sglang-{model_data.get('port', 30000)}")

        gpu_ids = model_data.get("gpu_ids", [0])
        if isinstance(gpu_ids, str):
            gpu_ids = [int(x) for x in gpu_ids.split(",")]

        base_config = BaseModelConfig(
            model_path=model_data["model_path"],
            served_model_name=model_data["served_model_name"],
            host=model_data.get("host", "0.0.0.0"),
            port=model_data.get("port", 30000),
            tensor_parallel=model_data.get("tensor_parallel", 1),
            gpu_ids=gpu_ids,
        )

        backend_type = InferenceBackendType(model_data.get("backend_type", "sglang"))
        if backend_type == InferenceBackendType.SGLANG:
            config = SGLangConfig(**base_config.model_dump())
        elif backend_type == InferenceBackendType.VLLM:
            config = VLLMConfig(**base_config.model_dump())
        else:
            config = base_config

        model = ModelInstance(
            id=model_id,
            name=model_data["name"],
            backend_type=backend_type,
            config=config,
            container_name=container_name,
            image=model_data.get("image", ""),
            status=ContainerStatus.STOPPED,
        )

        return model

    def _save_models_to_config(self) -> bool:
        models_config = []
        for model in self.models.values():
            models_config.append({
                "id": model.id,
                "name": model.name,
                "backend_type": model.backend_type.value,
                "model_path": model.config.model_path,
                "served_model_name": model.config.served_model_name,
                "host": model.config.host,
                "port": model.config.port,
                "tensor_parallel": model.config.tensor_parallel,
                "gpu_ids": model.config.gpu_ids,
                "image": model.image,
                "container_name": model.container_name,
            })

        return self.config_manager.set("models", models_config)

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
        elif backend_type == InferenceBackendType.VLLM:
            config = VLLMConfig(**base_config.model_dump(), **{k: v for k, v in kwargs.items() if v is not None})
        else:
            config = base_config

        final_image = image or self.config_manager.get(f"images.{backend_type.value}_image", DEFAULT_IMAGES.get(backend_type.value))

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
        self._save_models_to_config()
        logger.info(f"模型 {name} (ID: {model_id}) 创建成功")
        return model

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

            container_id = self.docker_manager.create_container(
                name=model.container_name,
                image=model.image,
                command=manager.build_command(),
                ports=manager.build_ports(),
                volumes=manager.build_volumes(),
                environment=manager.build_environment(),
                shm_size=manager.get_shm_size(),
                gpu_ids=manager.get_gpu_ids(),
            )

            if container_id:
                model.container_id = container_id
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
        self.docker_manager.remove_container(model.container_name, force=force)
        del self.models[model_id]
        self._save_models_to_config()
        logger.info(f"模型 {model.name} 删除成功")
        return True

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

        self._save_models_to_config()
        logger.info(f"模型 {model.name} 配置更新成功")
        return True

    def get_worker_urls(self) -> List[str]:
        urls = []
        for model in self.models.values():
            if model.status == ContainerStatus.RUNNING:
                port = model.config.port
                host = model.config.host
                if host == "0.0.0.0":
                    host = socket.gethostbyname(socket.gethostname())
                urls.append(f"http://{host}:{port}")
        return urls
