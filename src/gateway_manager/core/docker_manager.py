import docker
from docker.models.containers import Container
from docker.errors import NotFound, APIError
from typing import Optional, List, Dict, Any
import logging

from gateway_manager.models.schemas import ContainerStatus

logger = logging.getLogger(__name__)


class DockerManager:
    _instance: Optional['DockerManager'] = None
    _client: Optional[docker.DockerClient] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self):
        if self._client is None:
            try:
                self._client = docker.from_env()
                self._client.ping()
                logger.info("Docker连接成功")
            except Exception as e:
                logger.error(f"Docker连接失败: {e}")
                raise

    @property
    def client(self) -> docker.DockerClient:
        if self._client is None:
            self.__init__()
        return self._client

    def get_container(self, name: str) -> Optional[Container]:
        try:
            containers = self.client.containers.list(all=True, filters={"name": name})
            if containers:
                return containers[0]
            return None
        except Exception as e:
            logger.error(f"获取容器 {name} 失败: {e}")
            return None

    def get_container_status(self, name: str) -> ContainerStatus:
        container = self.get_container(name)
        if container is None:
            return ContainerStatus.UNKNOWN

        state = container.status.lower()
        if state == "running":
            return ContainerStatus.RUNNING
        elif state == "exited":
            return ContainerStatus.STOPPED
        elif state == "restarting":
            return ContainerStatus.STARTING
        elif state == "paused":
            return ContainerStatus.STOPPED
        else:
            return ContainerStatus.UNKNOWN

    def create_container(
        self,
        name: str,
        image: str,
        command: Optional[str] = None,
        ports: Optional[Dict[str, int]] = None,
        volumes: Optional[Dict[str, Dict[str, str]]] = None,
        environment: Optional[List[str]] = None,
        shm_size: Optional[str] = None,
        gpu_ids: Optional[List[int]] = None,
        restart_policy: str = "unless-stopped",
        detach: bool = True,
    ) -> Optional[Container]:
        try:
            existing = self.get_container(name)
            if existing:
                logger.info(f"容器 {name} 已存在")
                return existing

            host_config = {}
            if shm_size:
                host_config["shm_size"] = shm_size
            if gpu_ids is not None and len(gpu_ids) > 0:
                host_config["device_requests"] = [
                    docker.types.DeviceRequest(
                        device_ids=[str(gpu_id) for gpu_id in gpu_ids],
                        capabilities=[["gpu"]]
                    )
                ]

            host_config["restart_policy"] = {"Name": restart_policy}

            kwargs: Dict[str, Any] = {
                "name": name,
                "image": image,
                "detach": detach,
                "host_config": self.client.api.create_host_config(**host_config) if host_config else None,
            }

            if command:
                kwargs["command"] = command
            if ports:
                kwargs["ports"] = ports
            if volumes:
                kwargs["volumes"] = volumes
            if environment:
                kwargs["environment"] = environment

            container = self.client.containers.run(**kwargs)
            logger.info(f"容器 {name} 创建成功")
            return container

        except APIError as e:
            logger.error(f"创建容器 {name} 失败: {e}")
            return None

    def start_container(self, name: str) -> bool:
        container = self.get_container(name)
        if container is None:
            logger.error(f"容器 {name} 不存在")
            return False

        try:
            if container.status == "running":
                logger.info(f"容器 {name} 已经在运行")
                return True

            container.start()
            logger.info(f"容器 {name} 启动成功")
            return True
        except APIError as e:
            logger.error(f"启动容器 {name} 失败: {e}")
            return False

    def stop_container(self, name: str, timeout: int = 10) -> bool:
        container = self.get_container(name)
        if container is None:
            logger.error(f"容器 {name} 不存在")
            return False

        try:
            if container.status != "running":
                logger.info(f"容器 {name} 未在运行")
                return True

            container.stop(timeout=timeout)
            logger.info(f"容器 {name} 停止成功")
            return True
        except APIError as e:
            logger.error(f"停止容器 {name} 失败: {e}")
            return False

    def restart_container(self, name: str, timeout: int = 10) -> bool:
        container = self.get_container(name)
        if container is None:
            logger.error(f"容器 {name} 不存在")
            return False

        try:
            container.restart(timeout=timeout)
            logger.info(f"容器 {name} 重启成功")
            return True
        except APIError as e:
            logger.error(f"重启容器 {name} 失败: {e}")
            return False

    def remove_container(self, name: str, force: bool = False) -> bool:
        container = self.get_container(name)
        if container is None:
            logger.info(f"容器 {name} 不存在，无需删除")
            return True

        try:
            container.remove(force=force)
            logger.info(f"容器 {name} 删除成功")
            return True
        except APIError as e:
            logger.error(f"删除容器 {name} 失败: {e}")
            return False

    def get_container_logs(self, name: str, tail: int = 100) -> Optional[str]:
        container = self.get_container(name)
        if container is None:
            return None

        try:
            logs = container.logs(tail=tail, timestamps=True).decode("utf-8")
            return logs
        except Exception as e:
            logger.error(f"获取容器 {name} 日志失败: {e}")
            return None

    def list_containers(self, all: bool = True) -> List[Container]:
        try:
            return self.client.containers.list(all=all)
        except Exception as e:
            logger.error(f"列出容器失败: {e}")
            return []

    def get_docker_info(self) -> Dict[str, Any]:
        try:
            info = self.client.info()
            return {
                "containers_running": info.get("ContainersRunning", 0),
                "containers_total": info.get("Containers", 0),
                "images_total": info.get("Images", 0),
                "driver": info.get("Driver", ""),
                "memory_total": info.get("MemTotal", 0),
                "nvidia_version": info.get("NvidiaVersion", "N/A"),
            }
        except Exception as e:
            logger.error(f"获取Docker信息失败: {e}")
            return {}
