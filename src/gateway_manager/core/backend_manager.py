from abc import ABC, abstractmethod
from typing import Dict, List, Optional
import logging

from gateway_manager.models.schemas import (
    InferenceBackendType,
    BaseModelConfig,
    SGLangConfig,
    VLLMConfig,
    LMDeployConfig,
    TabbyConfig,
    OpenVINOConfig,
)

logger = logging.getLogger(__name__)


class BaseBackendManager(ABC):
    def __init__(self, config: BaseModelConfig, image: str):
        self.config = config
        self.image = image

    @abstractmethod
    def build_command(self) -> str:
        pass

    @abstractmethod
    def build_ports(self) -> Dict[str, int]:
        pass

    @abstractmethod
    def build_volumes(self) -> Dict[str, Dict[str, str]]:
        pass

    @abstractmethod
    def build_environment(self) -> List[str]:
        pass

    def get_shm_size(self) -> str:
        return "32g"

    def get_gpu_ids(self) -> List[int]:
        return self.config.gpu_ids


class SGLangManager(BaseBackendManager):
    def __init__(self, config: SGLangConfig, image: str = "lmsysorg/sglang:v0.5.10"):
        super().__init__(config, image)
        self.sglang_config = config

    def build_command(self) -> str:
        cmd_parts = [
            "python3 -m sglang.launch_server",
            f"--model-path {self.sglang_config.model_path}",
            f"--served-model-name {self.sglang_config.served_model_name}",
            f"--host {self.sglang_config.host}",
            f"--port {self.sglang_config.port}",
            f"--tensor-parallel-size {self.sglang_config.tensor_parallel}",
        ]

        if self.sglang_config.max_batch_size:
            cmd_parts.append(f"--max-batch-size {self.sglang_config.max_batch_size}")
        if self.sglang_config.max_sequence_length:
            cmd_parts.append(f"--max-sequence-length {self.sglang_config.max_sequence_length}")
        if self.sglang_config.mem_fraction:
            cmd_parts.append(f"--mem-fraction-static {self.sglang_config.mem_fraction}")

        for key, value in self.sglang_config.other_args.items():
            if isinstance(value, bool):
                if value:
                    cmd_parts.append(f"--{key}")
            else:
                cmd_parts.append(f"--{key} {value}")

        return " ".join(cmd_parts)

    def build_ports(self) -> Dict[str, int]:
        return {f"{self.sglang_config.port}/tcp": self.sglang_config.port}

    def build_volumes(self) -> Dict[str, Dict[str, str]]:
        return {
            "/data/models": {"bind": "/data/models", "mode": "ro"}
        }

    def build_environment(self) -> List[str]:
        return [
            f"CUDA_VISIBLE_DEVICES={','.join(map(str, self.sglang_config.gpu_ids))}",
        ]


class VLLMManager(BaseBackendManager):
    def __init__(self, config: VLLMConfig, image: str = "vllm/vllm:v0.3.0"):
        super().__init__(config, image)
        self.vllm_config = config

    def build_command(self) -> str:
        cmd_parts = [
            "python3 -m vllm.entrypoints.openai.api_server",
            f"--model {self.vllm_config.model_path}",
            f"--served-model-name {self.vllm_config.served_model_name}",
            f"--host {self.vllm_config.host}",
            f"--port {self.vllm_config.port}",
            f"--tensor-parallel-size {self.vllm_config.tensor_parallel}",
        ]

        if self.vllm_config.max_batch_size:
            cmd_parts.append(f"--max-num-batched-tokens {self.vllm_config.max_batch_size}")
        if self.vllm_config.max_sequence_length:
            cmd_parts.append(f"--max-sequence-length {self.vllm_config.max_sequence_length}")

        for key, value in self.vllm_config.other_args.items():
            if isinstance(value, bool):
                if value:
                    cmd_parts.append(f"--{key}")
            else:
                cmd_parts.append(f"--{key} {value}")

        return " ".join(cmd_parts)

    def build_ports(self) -> Dict[str, int]:
        return {f"{self.vllm_config.port}/tcp": self.vllm_config.port}

    def build_volumes(self) -> Dict[str, Dict[str, str]]:
        return {
            "/data/models": {"bind": "/data/models", "mode": "ro"}
        }

    def build_environment(self) -> List[str]:
        return [
            f"CUDA_VISIBLE_DEVICES={','.join(map(str, self.vllm_config.gpu_ids))}",
        ]


class LMDeployManager(BaseBackendManager):
    def __init__(self, config: LMDeployConfig, image: str = "openmmlab/lmdeploy:latest"):
        super().__init__(config, image)
        self.lmdeploy_config = config

    def build_command(self) -> str:
        cmd_parts = [
            "lmdeploy serve api_server",
            self.lmdeploy_config.model_path,
            f"--server-name {self.lmdeploy_config.host}",
            f"--server-port {self.lmdeploy_config.port}",
            f"--tp {self.lmdeploy_config.tensor_parallel}",
        ]

        for key, value in self.lmdeploy_config.other_args.items():
            if isinstance(value, bool):
                if value:
                    cmd_parts.append(f"--{key}")
            else:
                cmd_parts.append(f"--{key} {value}")

        return " ".join(cmd_parts)

    def build_ports(self) -> Dict[str, int]:
        return {f"{self.lmdeploy_config.port}/tcp": self.lmdeploy_config.port}

    def build_volumes(self) -> Dict[str, Dict[str, str]]:
        return {
            "/data/models": {"bind": "/data/models", "mode": "ro"}
        }

    def build_environment(self) -> List[str]:
        return [
            f"CUDA_VISIBLE_DEVICES={','.join(map(str, self.lmdeploy_config.gpu_ids))}",
        ]


class TabbyManager(BaseBackendManager):
    def __init__(self, config: TabbyConfig, image: str = "ghcr.io/tabby/tabby:latest"):
        super().__init__(config, image)
        self.tabby_config = config

    def build_command(self) -> str:
        cmd_parts = [
            "tabby",
            "serve",
            f"--model {self.tabby_config.model_path}",
            f"--host {self.tabby_config.host}",
            f"--port {self.tabby_config.port}",
        ]

        for key, value in self.tabby_config.other_args.items():
            if isinstance(value, bool):
                if value:
                    cmd_parts.append(f"--{key}")
            else:
                cmd_parts.append(f"--{key} {value}")

        return " ".join(cmd_parts)

    def build_ports(self) -> Dict[str, int]:
        return {f"{self.tabby_config.port}/tcp": self.tabby_config.port}

    def build_volumes(self) -> Dict[str, Dict[str, str]]:
        return {
            "/data/models": {"bind": "/data/models", "mode": "ro"}
        }

    def build_environment(self) -> List[str]:
        return [
            f"CUDA_VISIBLE_DEVICES={','.join(map(str, self.tabby_config.gpu_ids))}",
        ]


class OpenVINOManager(BaseBackendManager):
    def __init__(self, config: OpenVINOConfig, image: str = "openvino/ovms:latest"):
        super().__init__(config, image)
        self.openvino_config = config

    def build_command(self) -> str:
        cmd_parts = [
            "/ovms/bin/ovms",
            f"--model_path {self.openvino_config.model_path}",
            f"--model_name {self.openvino_config.served_model_name}",
            f"--port {self.openvino_config.port}",
        ]

        for key, value in self.openvino_config.other_args.items():
            cmd_parts.append(f"--{key}")
            if not isinstance(value, bool):
                cmd_parts.append(str(value))

        return " ".join(cmd_parts)

    def build_ports(self) -> Dict[str, int]:
        return {f"{self.openvino_config.port}/tcp": self.openvino_config.port}

    def build_volumes(self) -> Dict[str, Dict[str, str]]:
        return {
            "/data/models": {"bind": "/data/models", "mode": "ro"}
        }

    def build_environment(self) -> List[str]:
        return []


class BackendManagerFactory:
    _managers: Dict[InferenceBackendType, type] = {
        InferenceBackendType.SGLANG: SGLangManager,
        InferenceBackendType.VLLM: VLLMManager,
        InferenceBackendType.LMDEPLOY: LMDeployManager,
        InferenceBackendType.TABBY: TabbyManager,
        InferenceBackendType.OPENVINO: OpenVINOManager,
    }

    _default_images: Dict[InferenceBackendType, str] = {
        InferenceBackendType.SGLANG: "lmsysorg/sglang:v0.5.10",
        InferenceBackendType.VLLM: "vllm/vllm:v0.3.0",
        InferenceBackendType.LMDEPLOY: "openmmlab/lmdeploy:latest",
        InferenceBackendType.TABBY: "ghcr.io/tabby/tabby:latest",
        InferenceBackendType.OPENVINO: "openvino/ovms:latest",
    }

    @classmethod
    def create_manager(
        cls,
        backend_type: InferenceBackendType,
        config: BaseModelConfig,
        image: Optional[str] = None,
    ) -> BaseBackendManager:
        manager_class = cls._managers.get(backend_type)
        if manager_class is None:
            raise ValueError(f"不支持的后端类型: {backend_type}")

        final_image = image or cls._default_images.get(backend_type, "lmsysorg/sglang:v0.5.10")
        return manager_class(config, final_image)

    @classmethod
    def get_default_image(cls, backend_type: InferenceBackendType) -> str:
        return cls._default_images.get(backend_type, "lmsysorg/sglang:v0.5.10")

    @classmethod
    def register_manager(cls, backend_type: InferenceBackendType, manager_class: type, default_image: str):
        cls._managers[backend_type] = manager_class
        cls._default_images[backend_type] = default_image
