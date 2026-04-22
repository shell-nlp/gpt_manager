import json
from typing import Dict, Any, Optional
from pathlib import Path
from loguru import logger

from gateway_manager.core.constants import DEFAULT_IMAGES


class ConfigManager:
    def __init__(self, config_file: str = "gateway_config.json"):
        self.config_file = config_file
        self._config: Optional[Dict[str, Any]] = None

    def _get_config_path(self) -> Path:
        project_root = Path(__file__).parent.parent.parent.parent
        return project_root / self.config_file

    def load(self) -> Dict[str, Any]:
        if self._config is not None:
            return self._config

        config_path = self._get_config_path()
        logger.info(f"Loading config from: {config_path}")

        if not config_path.exists():
            logger.info("Config file not found, creating default config")
            self._config = self._get_default_config()
            self.save(self._config)
            return self._config

        try:
            with open(config_path, "r", encoding="utf-8") as f:
                self._config = json.load(f)
            logger.info("Config loaded successfully")
            return self._config
        except Exception as e:
            logger.error(f"Failed to load config: {e}")
            self._config = self._get_default_config()
            return self._config

    def save(self, config: Dict[str, Any]) -> bool:
        config_path = self._get_config_path()
        try:
            config_path.parent.mkdir(parents=True, exist_ok=True)
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(config, f, indent=4, ensure_ascii=False)
            self._config = config
            logger.info(f"Config saved to: {config_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to save config: {e}")
            return False

    def _get_default_config(self) -> Dict[str, Any]:
        return {
            "images": {
                "sglang_image": DEFAULT_IMAGES["sglang"],
                "vllm_image": DEFAULT_IMAGES["vllm"],
                "gateway_image": "lmsysorg/sgl-model-gateway:v0.3.2",
            },
            "models": [],
            "gateway": {
                "host": "0.0.0.0",
                "port": 8082,
                "policy": "cache_aware",
                "image": "lmsysorg/sgl-model-gateway:v0.3.2",
                "worker_urls": [],
            },
        }

    def get(self, key: str, default: Any = None) -> Any:
        config = self.load()
        keys = key.split(".")
        value = config
        for k in keys:
            if isinstance(value, dict):
                value = value.get(k)
            else:
                return default
        return value if value is not None else default

    def set(self, key: str, value: Any) -> bool:
        config = self.load()
        keys = key.split(".")
        current = config
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]
        current[keys[-1]] = value
        return self.save(config)

    def reload(self) -> Dict[str, Any]:
        self._config = None
        return self.load()
