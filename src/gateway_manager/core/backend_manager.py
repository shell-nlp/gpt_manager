from abc import ABC, abstractmethod
from typing import Dict, List, Optional

from gateway_manager.models.schemas import (
    InferenceBackendType,
    BaseModelConfig,
    SGLangConfig,
    VLLMConfig,
)
from gateway_manager.core.constants import DEFAULT_IMAGES


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
    def __init__(self, config: SGLangConfig, image: str = DEFAULT_IMAGES["sglang"]):
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
    def __init__(self, config: VLLMConfig, image: str = DEFAULT_IMAGES["vllm"]):
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


class BackendManagerFactory:
    _managers: Dict[InferenceBackendType, type] = {
        InferenceBackendType.SGLANG: SGLangManager,
        InferenceBackendType.VLLM: VLLMManager,
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

        final_image = image or DEFAULT_IMAGES.get(backend_type.value, DEFAULT_IMAGES["sglang"])
        return manager_class(config, final_image)
