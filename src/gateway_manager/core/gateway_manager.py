from typing import Dict, List, Optional, Any
import logging

from gateway_manager.models.schemas import GatewayConfig, ContainerStatus, LoadBalancingPolicy
from gateway_manager.core.docker_manager import DockerManager

logger = logging.getLogger(__name__)


class GatewayManager:
    def __init__(self, config: GatewayConfig):
        self.config = config
        self.docker_manager = DockerManager()

    def _build_worker_urls_arg(self) -> str:
        if not self.config.worker_urls:
            return ""
        return ",".join(self.config.worker_urls)

    def _build_command(self) -> str:
        worker_urls = self._build_worker_urls_arg()
        if not worker_urls:
            logger.warning("没有配置 worker URLs")

        cmd_parts = [
            "--worker-urls",
            worker_urls,
            "--policy",
            self.config.policy.value,
            "--host",
            self.config.host,
            "--port",
            str(self.config.port),
        ]

        return " ".join(cmd_parts)

    def start(self) -> bool:
        if self.config.status == ContainerStatus.RUNNING:
            logger.info("Gateway 已经在运行")
            return True

        try:
            cmd = self._build_command()
            ports = {f"{self.config.port}/tcp": self.config.port}

            container = self.docker_manager.create_container(
                name=self.config.container_name,
                image=self.config.image,
                command=cmd,
                ports=ports,
                restart_policy="always",
            )

            if container:
                self.config.container_id = container.id
                self.config.status = ContainerStatus.RUNNING
                logger.info("Gateway 启动成功")
                return True

            self.config.status = ContainerStatus.ERROR
            return False

        except Exception as e:
            logger.error(f"启动 Gateway 失败: {e}")
            self.config.status = ContainerStatus.ERROR
            return False

    def stop(self) -> bool:
        if self.docker_manager.stop_container(self.config.container_name):
            self.config.status = ContainerStatus.STOPPED
            logger.info("Gateway 停止成功")
            return True
        return False

    def restart(self) -> bool:
        self.stop()
        return self.start()

    def update_worker_urls(self, worker_urls: List[str]) -> bool:
        self.config.worker_urls = worker_urls

        if self.config.status == ContainerStatus.RUNNING:
            self.restart()

        logger.info(f"Gateway worker URLs 已更新: {worker_urls}")
        return True

    def update_policy(self, policy: LoadBalancingPolicy) -> bool:
        self.config.policy = policy

        if self.config.status == ContainerStatus.RUNNING:
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

        if host is not None and host != self.config.host:
            self.config.host = host
            needs_restart = True

        if port is not None and port != self.config.port:
            self.config.port = port
            needs_restart = True

        if image is not None and image != self.config.image:
            self.config.image = image
            needs_restart = True

        if policy is not None and policy != self.config.policy:
            self.config.policy = policy
            needs_restart = True

        if worker_urls is not None:
            self.config.worker_urls = worker_urls
            needs_restart = True

        if needs_restart and self.config.status == ContainerStatus.RUNNING:
            self.restart()

        logger.info("Gateway 配置已更新")
        return True

    def get_status(self) -> ContainerStatus:
        self.config.status = self.docker_manager.get_container_status(self.config.container_name)
        return self.config.status

    def get_logs(self, tail: int = 100) -> Optional[str]:
        return self.docker_manager.get_container_logs(self.config.container_name, tail)

    def get_info(self) -> Dict[str, Any]:
        return {
            "worker_urls": self.config.worker_urls,
            "policy": self.config.policy.value,
            "host": self.config.host,
            "port": self.config.port,
            "image": self.config.image,
            "status": self.get_status().value,
            "container_name": self.config.container_name,
        }

    def load_from_config(self, config: Dict[str, Any]) -> bool:
        try:
            if "gateway" in config:
                gw_config = config["gateway"]
                self.config.host = gw_config.get("host", self.config.host)
                self.config.port = gw_config.get("port", self.config.port)
                self.config.image = gw_config.get("image", self.config.image)
                self.config.policy = LoadBalancingPolicy(gw_config.get("policy", self.config.policy.value))
                self.config.worker_urls = gw_config.get("worker_urls", self.config.worker_urls)

            logger.info("Gateway 配置加载成功")
            return True
        except Exception as e:
            logger.error(f"加载 Gateway 配置失败: {e}")
            return False

    def export_config(self) -> Dict[str, Any]:
        return {
            "gateway": {
                "host": self.config.host,
                "port": self.config.port,
                "image": self.config.image,
                "policy": self.config.policy.value,
                "worker_urls": self.config.worker_urls,
            }
        }
