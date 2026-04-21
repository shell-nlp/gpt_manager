from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from enum import Enum


class InferenceBackendType(str, Enum):
    SGLANG = "sglang"
    VLLM = "vllm"


class ContainerStatus(str, Enum):
    RUNNING = "running"
    STOPPED = "stopped"
    STARTING = "starting"
    STOPPING = "stopping"
    ERROR = "error"
    UNKNOWN = "unknown"


class BaseModelConfig(BaseModel):
    model_path: str = Field(description="模型路径")
    served_model_name: str = Field(description="服务模型名称")
    host: str = Field(default="0.0.0.0", description="监听地址")
    port: int = Field(default=30000, description="监听端口")
    tensor_parallel: int = Field(default=1, description="张量并行数")
    gpu_ids: List[int] = Field(default_factory=lambda: [0], description="GPU设备ID列表")


class SGLangConfig(BaseModelConfig):
    max_batch_size: int = Field(default=128, description="最大批次大小")
    max_sequence_length: int = Field(default=8192, description="最大序列长度")
    mem_fraction: float = Field(default=0.9, description="GPU内存占用比例")
    other_args: Dict[str, Any] = Field(default_factory=dict, description="其他启动参数")


class VLLMConfig(BaseModelConfig):
    max_batch_size: int = Field(default=128, description="最大批次大小")
    max_sequence_length: int = Field(default=8192, description="最大序列长度")
    mem_fraction: float = Field(default=0.9, description="GPU内存占用比例")
    other_args: Dict[str, Any] = Field(default_factory=dict, description="其他启动参数")


class ModelInstance(BaseModel):
    id: str
    name: str
    backend_type: InferenceBackendType
    config: BaseModelConfig
    container_id: Optional[str] = None
    container_name: str
    image: str = "lmsysorg/sglang:v0.5.10"
    status: ContainerStatus = ContainerStatus.STOPPED


class LoadBalancingPolicy(str, Enum):
    ROUND_ROBIN = "round_robin"
    LEAST_LOADED = "least_loaded"
    POWER_OF_TWO = "power_of_two"
    CACHE_AWARE = "cache_aware"
    RANDOM = "random"


class GatewayConfig(BaseModel):
    worker_urls: List[str] = Field(default_factory=list, description="Worker URL列表")
    policy: LoadBalancingPolicy = Field(default=LoadBalancingPolicy.CACHE_AWARE, description="负载均衡策略")
    host: str = Field(default="0.0.0.0", description="监听地址")
    port: int = Field(default=8082, description="监听端口")
    image: str = Field(default="lmsysorg/sgl-model-gateway:v0.3.2", description="Gateway镜像")
    container_id: Optional[str] = None
    container_name: str = "sglang-router"
    status: ContainerStatus = ContainerStatus.STOPPED


class AppConfig(BaseModel):
    sglang_image: str = Field(default="lmsysorg/sglang:v0.5.10", description="SGLang默认镜像")
    vllm_image: str = Field(default="vllm/vllm:v0.3.0", description="vLLM默认镜像")
    tabby_image: str = Field(default="ghcr.io/tabby/tabby:latest", description="Tabby默认镜像")
    lmdeploy_image: str = Field(default="openmmlab/lmdeploy:latest", description="LMDeploy默认镜像")
    openvino_image: str = Field(default="openvino/ovms:latest", description="OpenVINO默认镜像")
    gateway_image: str = Field(default="lmsysorg/sgl-model-gateway:v0.3.2", description="Gateway默认镜像")
    config_file: str = Field(default="config.yaml", description="配置文件路径")
