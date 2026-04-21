from typing import Dict, List, Optional, Any
from loguru import logger

from gateway_manager.models.schemas import ContainerStatus, LoadBalancingPolicy
from gateway_manager.core.docker_manager import DockerManager
from gateway_manager.core.config_manager import ConfigManager


class GatewayManager:
    def __init__(self, config_manager: ConfigManager):
        self.config_manager = config_manager
        self.docker_manager = DockerManager()
        self._load_config()

    def _load_config(self) -> None:
        config = self.config_manager.load()
        gateway_config = config.get("gateway", {})
        self.worker_urls: List[str] = gateway_config.get("worker_urls", [])
        self.policy: LoadBalancingPolicy = LoadBalancingPolicy(gateway_config.get("policy", "cache_aware"))
        self.host: str = gateway_config.get("host", "0.0.0.0")
        self.port: int = gateway_config.get("port", 8082)
        self.image: str = gateway_config.get("image", "lmsysorg/sgl-model-gateway:v0.3.2")
        self.container_name: str = "sgl-gateway"
        self.status: ContainerStatus = ContainerStatus.STOPPED

    def _save_config(self) -> bool:
        gateway_config = {
            "worker_urls": self.worker_urls,
            "policy": self.policy.value,
            "host": self.host,
            "port": self.port,
            "image": self.image,
        }
        return self.config_manager.set("gateway", gateway_config)

    def _build_worker_urls_arg(self) -> str:
        if not self.worker_urls:
            return ""
        return ",".join(self.worker_urls)

    def _build_command(self) -> str:
        worker_urls = self._build_worker_urls_arg()
        if not worker_urls:
            logger.warning("没有配置 worker URLs")

        cmd_parts = [
            "--worker-urls",
            worker_urls,
            "--policy",
            self.policy.value,
            "--host",
            self.host,
            "--port",
            str(self.port),
        ]

        return " ".join(cmd_parts)

    def start(self) -> bool:
        if self.status == ContainerStatus.RUNNING:
            logger.info("Gateway 已经在运行")
            return True

        try:
            cmd = self._build_command()
            ports = {f"{self.port}/tcp": self.port}

            container = self.docker_manager.create_container(
                name=self.container_name,
                image=self.image,
                command=cmd,
                ports=ports,
                restart_policy="always",
            )

            if container:
                self.status = ContainerStatus.RUNNING
                logger.info("Gateway 启动成功")
                return True

            self.status = ContainerStatus.ERROR
            return False

        except Exception as e:
            logger.error(f"启动 Gateway 失败: {e}")
            self.status = ContainerStatus.ERROR
            return False

    def stop(self) -> bool:
        if self.docker_manager.stop_container(self.container_name):
            self.status = ContainerStatus.STOPPED
            logger.info("Gateway 停止成功")
            return True
        return False

    def restart(self) -> bool:
        self.stop()
        return self.start()

    def update_worker_urls(self, worker_urls: List[str]) -> bool:
        self.worker_urls = worker_urls
        self._save_config()

        if self.status == ContainerStatus.RUNNING:
            self.restart()

        logger.info(f"Gateway worker URLs 已更新: {worker_urls}")
        return True

    def update_policy(self, policy: LoadBalancingPolicy) -> bool:
        self.policy = policy
        self._save_config()

        if self.status == ContainerStatus.RUNNING:
            self.restart()

        logger.info(f"Gateway 策略已更新: {policy}")
        return True

    def update_config(
        self,
        host: Optional[str] = None,
        port: Optional[int] = None,
        image: Optional[str] = None,
        policy: Optional[LoadBalancingPolicy] = None,
        worker_urls: Optional[List[str]] = None,
    ) -> bool:
        needs_restart = False

        if host is not None and host != self.host:
            self.host = host
            needs_restart = True

        if port is not None and port != self.port:
            self.port = port
            needs_restart = True

        if image is not None and image != self.image:
            self.image = image
            needs_restart = True

        if policy is not None and policy != self.policy:
            self.policy = policy
            needs_restart = True

        if worker_urls is not None:
            self.worker_urls = worker_urls
            needs_restart = True

        self._save_config()

        if needs_restart and self.status == ContainerStatus.RUNNING:
            self.restart()

        logger.info("Gateway 配置已更新")
        return True

    def get_status(self) -> ContainerStatus:
        self.status = self.docker_manager.get_container_status(self.container_name)
        return self.status

    def get_logs(self, tail: int = 100) -> Optional[str]:
        return self.docker_manager.get_container_logs(self.container_name, tail)

    def get_info(self) -> Dict[str, Any]:
        return {
            "worker_urls": self.worker_urls,
            "policy": self.policy.value,
            "host": self.host,
            "port": self.port,
            "image": self.image,
            "status": self.get_status().value,
            "container_name": self.container_name,
        }
