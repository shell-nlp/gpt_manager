import docker
from docker.models.containers import Container
from docker.errors import APIError
from typing import Optional, List, Dict, Any
import logging
import json

from gateway_manager.models.schemas import ContainerStatus

logger = logging.getLogger(__name__)


class DockerManager:
    _instance: Optional["DockerManager"] = None
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

            kwargs: Dict[str, Any] = {
                "name": name,
                "image": image,
                "detach": detach,
            }

            if command:
                kwargs["command"] = command
            if ports:
                kwargs["ports"] = ports
            if volumes:
                kwargs["volumes"] = volumes
            if environment:
                kwargs["environment"] = environment
            logger.info(f"创建容器 {name} 的参数: {json.dumps(kwargs, indent=2)}")
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
            logger.error(f"容器 {name} 不存在")
            return False

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
            logs = container.logs(tail=tail, timestamps=True)
            return logs.decode("utf-8", errors="ignore")
        except Exception as e:
            logger.error(f"获取容器 {name} 日志失败: {e}")
            return None

    def get_docker_info(self) -> Dict[str, Any]:
        try:
            info = self.client.info()
            return {
                "version": info.get("ServerVersion", "unknown"),
                "containers_running": info.get("ContainersRunning", 0),
                "containers_stopped": info.get("ContainersStopped", 0),
                "images": info.get("Images", 0),
            }
        except Exception as e:
            logger.error(f"获取 Docker 信息失败: {e}")
            return {"error": str(e)}
