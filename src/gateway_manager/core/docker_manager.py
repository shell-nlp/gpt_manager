import subprocess
import json
from typing import Optional, Dict, Any, List
from loguru import logger

from gateway_manager.models.schemas import ContainerStatus


class DockerManager:
    def __init__(self):
        self._check_docker()

    def _check_docker(self) -> bool:
        try:
            result = subprocess.run(
                ["docker", "info"],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                logger.info("Docker 连接成功")
                return True
            logger.error(f"Docker 连接失败: {result.stderr}")
            return False
        except Exception as e:
            logger.error(f"Docker 连接失败: {e}")
            return False

    def _run_command(self, args: List[str], timeout: int = 30) -> subprocess.CompletedProcess:
        try:
            result = subprocess.run(
                args,
                capture_output=True,
                text=True,
                timeout=timeout
            )
            return result
        except subprocess.TimeoutExpired:
            logger.error(f"命令执行超时: {' '.join(args)}")
            raise
        except Exception as e:
            logger.error(f"命令执行失败: {e}")
            raise

    def get_container_id(self, name: str) -> Optional[str]:
        try:
            result = self._run_command(["docker", "inspect", "-f", "{{.Id}}", name])
            if result.returncode == 0 and result.stdout.strip():
                return result.stdout.strip()
            return None
        except Exception:
            return None

    def get_container_status(self, name: str) -> ContainerStatus:
        try:
            result = self._run_command(["docker", "inspect", "-f", "{{.State.Status}}", name])
            if result.returncode != 0:
                return ContainerStatus.UNKNOWN

            status = result.stdout.strip().lower()
            if status == "running":
                return ContainerStatus.RUNNING
            elif status == "exited":
                return ContainerStatus.STOPPED
            elif status == "restarting":
                return ContainerStatus.STARTING
            elif status == "paused":
                return ContainerStatus.STOPPED
            else:
                return ContainerStatus.UNKNOWN
        except Exception:
            return ContainerStatus.UNKNOWN

    def container_exists(self, name: str) -> bool:
        return self.get_container_id(name) is not None

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
    ) -> Optional[str]:
        try:
            if self.container_exists(name):
                logger.info(f"容器 {name} 已存在")
                return self.get_container_id(name)

            args = ["docker", "run", "-d", "--name", name]

            if restart_policy:
                args.extend(["--restart", restart_policy])

            if ports:
                for container_port, host_port in ports.items():
                    args.extend(["-p", f"{host_port}:{container_port}"])

            if volumes:
                for host_path, mount_config in volumes.items():
                    mode = mount_config.get("bind", "ro")
                    args.extend(["-v", f"{host_path}:{mode}"])

            if environment:
                for env_var in environment:
                    args.extend(["-e", env_var])

            if shm_size:
                args.extend(["--shm-size", shm_size])

            if gpu_ids is not None and len(gpu_ids) > 0:
                args.extend(["--gpus", f"device={','.join(str(g) for g in gpu_ids)}"])

            args.append(image)

            if command:
                args.extend(command.split())

            logger.info(f"创建容器命令: {' '.join(args)}")
            result = self._run_command(args, timeout=60)

            if result.returncode == 0:
                container_id = result.stdout.strip()
                logger.info(f"容器 {name} 创建成功, ID: {container_id}")
                return container_id
            else:
                logger.error(f"创建容器 {name} 失败: {result.stderr}")
                return None

        except Exception as e:
            logger.error(f"创建容器 {name} 失败: {e}")
            return None

    def start_container(self, name: str) -> bool:
        try:
            if not self.container_exists(name):
                logger.error(f"容器 {name} 不存在")
                return False

            status = self.get_container_status(name)
            if status == ContainerStatus.RUNNING:
                logger.info(f"容器 {name} 已经在运行")
                return True

            result = self._run_command(["docker", "start", name])
            if result.returncode == 0:
                logger.info(f"容器 {name} 启动成功")
                return True
            else:
                logger.error(f"启动容器 {name} 失败: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"启动容器 {name} 失败: {e}")
            return False

    def stop_container(self, name: str, timeout: int = 10) -> bool:
        try:
            if not self.container_exists(name):
                logger.error(f"容器 {name} 不存在")
                return False

            status = self.get_container_status(name)
            if status != ContainerStatus.RUNNING:
                logger.info(f"容器 {name} 未在运行")
                return True

            result = self._run_command(["docker", "stop", "-t", str(timeout), name])
            if result.returncode == 0:
                logger.info(f"容器 {name} 停止成功")
                return True
            else:
                logger.error(f"停止容器 {name} 失败: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"停止容器 {name} 失败: {e}")
            return False

    def restart_container(self, name: str, timeout: int = 10) -> bool:
        try:
            if not self.container_exists(name):
                logger.error(f"容器 {name} 不存在")
                return False

            result = self._run_command(["docker", "restart", "-t", str(timeout), name])
            if result.returncode == 0:
                logger.info(f"容器 {name} 重启成功")
                return True
            else:
                logger.error(f"重启容器 {name} 失败: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"重启容器 {name} 失败: {e}")
            return False

    def remove_container(self, name: str, force: bool = False) -> bool:
        try:
            if not self.container_exists(name):
                logger.info(f"容器 {name} 不存在，视为已删除")
                return True

            self.stop_container(name)
            args = ["docker", "rm"]
            if force:
                args.append("-f")
            args.append(name)

            result = self._run_command(args)
            if result.returncode == 0:
                logger.info(f"容器 {name} 删除成功")
                return True
            else:
                logger.error(f"删除容器 {name} 失败: {result.stderr}")
                return False

        except Exception as e:
            logger.error(f"删除容器 {name} 失败: {e}")
            return False

    def get_container_logs(self, name: str, tail: int = 100) -> Optional[str]:
        try:
            if not self.container_exists(name):
                return None

            result = self._run_command(["docker", "logs", "--tail", str(tail), "--timestamps", name])
            if result.returncode == 0:
                return result.stdout
            else:
                return result.stderr

        except Exception as e:
            logger.error(f"获取容器 {name} 日志失败: {e}")
            return None

    def get_docker_info(self) -> Dict[str, Any]:
        try:
            result = self._run_command(["docker", "info", "--format", "{{json .}}"])
            if result.returncode == 0:
                info = json.loads(result.stdout)
                return {
                    "version": info.get("ServerVersion", "unknown"),
                    "containers_running": info.get("ContainersRunning", 0),
                    "containers_stopped": info.get("ContainersStopped", 0),
                    "images": info.get("Images", 0),
                }
            return {"error": "Failed to get docker info"}
        except Exception as e:
            logger.error(f"获取 Docker 信息失败: {e}")
            return {"error": str(e)}
