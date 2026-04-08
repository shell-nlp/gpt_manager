from fastapi import APIRouter, HTTPException
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

from gateway_manager.core.model_manager import ModelManager
from gateway_manager.core.gateway_manager import GatewayManager
from gateway_manager.models.schemas import (
    InferenceBackendType,
    GatewayConfig,
    LoadBalancingPolicy,
    AppConfig,
)

router = APIRouter()

model_manager: Optional[ModelManager] = None
gateway_manager: Optional[GatewayManager] = None
app_config: Optional[AppConfig] = None


def init_managers(
    mgr: ModelManager,
    gw_mgr: GatewayManager,
    cfg: AppConfig,
):
    global model_manager, gateway_manager, app_config
    model_manager = mgr
    gateway_manager = gw_mgr
    app_config = cfg


class CreateModelRequest(BaseModel):
    name: str
    backend_type: InferenceBackendType
    model_path: str
    served_model_name: str
    host: str = "0.0.0.0"
    port: int = 30000
    tensor_parallel: int = 1
    gpu_ids: Optional[List[int]] = None
    image: Optional[str] = None


class UpdateModelRequest(BaseModel):
    image: Optional[str] = None


class UpdateGatewayRequest(BaseModel):
    host: Optional[str] = None
    port: Optional[int] = None
    image: Optional[str] = None
    policy: Optional[LoadBalancingPolicy] = None
    worker_urls: Optional[List[str]] = None


@router.get("/api/docker/info")
async def get_docker_info():
    from gateway_manager.core.docker_manager import DockerManager
    dm = DockerManager()
    return dm.get_docker_info()


@router.get("/api/models")
async def list_models():
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")
    models = model_manager.list_models()
    return {
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "backend_type": m.backend_type.value,
                "model_path": m.config.model_path,
                "served_model_name": m.config.served_model_name,
                "host": m.config.host,
                "port": m.config.port,
                "tensor_parallel": m.config.tensor_parallel,
                "gpu_ids": m.config.gpu_ids,
                "image": m.image,
                "status": m.status.value,
                "container_name": m.container_name,
            }
            for m in models
        ]
    }


@router.post("/api/models")
async def create_model(req: CreateModelRequest):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    try:
        model = model_manager.create_model(
            name=req.name,
            backend_type=req.backend_type,
            model_path=req.model_path,
            served_model_name=req.served_model_name,
            host=req.host,
            port=req.port,
            tensor_parallel=req.tensor_parallel,
            gpu_ids=req.gpu_ids,
            image=req.image,
        )
        return {"id": model.id, "name": model.name, "message": "Model created successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/api/models/{model_id}")
async def get_model(model_id: str):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    model = model_manager.get_model(model_id)
    if model is None:
        raise HTTPException(status_code=404, detail="Model not found")

    return {
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
        "status": model.status.value,
        "container_name": model.container_name,
    }


@router.post("/api/models/{model_id}/start")
async def start_model(model_id: str):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    success = model_manager.start_model(model_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to start model")
    return {"message": "Model started successfully"}


@router.post("/api/models/{model_id}/stop")
async def stop_model(model_id: str):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    success = model_manager.stop_model(model_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to stop model")
    return {"message": "Model stopped successfully"}


@router.post("/api/models/{model_id}/restart")
async def restart_model(model_id: str):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    success = model_manager.restart_model(model_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to restart model")
    return {"message": "Model restarted successfully"}


@router.delete("/api/models/{model_id}")
async def delete_model(model_id: str):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    success = model_manager.delete_model(model_id)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to delete model")
    return {"message": "Model deleted successfully"}


@router.patch("/api/models/{model_id}")
async def update_model(model_id: str, req: UpdateModelRequest):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    success = model_manager.update_model_config(model_id, image=req.image)
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update model")
    return {"message": "Model updated successfully"}


@router.get("/api/models/{model_id}/logs")
async def get_model_logs(model_id: str, tail: int = 100):
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    logs = model_manager.get_model_logs(model_id, tail)
    if logs is None:
        raise HTTPException(status_code=404, detail="Model not found or no logs available")
    return {"logs": logs}


@router.get("/api/gateway")
async def get_gateway():
    if gateway_manager is None:
        raise HTTPException(status_code=500, detail="Gateway manager not initialized")

    return gateway_manager.get_info()


@router.post("/api/gateway/start")
async def start_gateway():
    if gateway_manager is None:
        raise HTTPException(status_code=500, detail="Gateway manager not initialized")

    success = gateway_manager.start()
    if not success:
        raise HTTPException(status_code=400, detail="Failed to start gateway")
    return {"message": "Gateway started successfully"}


@router.post("/api/gateway/stop")
async def stop_gateway():
    if gateway_manager is None:
        raise HTTPException(status_code=500, detail="Gateway manager not initialized")

    success = gateway_manager.stop()
    if not success:
        raise HTTPException(status_code=400, detail="Failed to stop gateway")
    return {"message": "Gateway stopped successfully"}


@router.post("/api/gateway/restart")
async def restart_gateway():
    if gateway_manager is None:
        raise HTTPException(status_code=500, detail="Gateway manager not initialized")

    success = gateway_manager.restart()
    if not success:
        raise HTTPException(status_code=400, detail="Failed to restart gateway")
    return {"message": "Gateway restarted successfully"}


@router.patch("/api/gateway")
async def update_gateway(req: UpdateGatewayRequest):
    if gateway_manager is None:
        raise HTTPException(status_code=500, detail="Gateway manager not initialized")

    success = gateway_manager.update_config(
        host=req.host,
        port=req.port,
        image=req.image,
        policy=req.policy,
        worker_urls=req.worker_urls,
    )
    if not success:
        raise HTTPException(status_code=400, detail="Failed to update gateway")
    return {"message": "Gateway updated successfully"}


@router.get("/api/gateway/logs")
async def get_gateway_logs(tail: int = 100):
    if gateway_manager is None:
        raise HTTPException(status_code=500, detail="Gateway manager not initialized")

    logs = gateway_manager.get_logs(tail)
    if logs is None:
        raise HTTPException(status_code=404, detail="Gateway not found or no logs available")
    return {"logs": logs}


@router.get("/api/config/images")
async def get_images():
    if app_config is None:
        raise HTTPException(status_code=500, detail="App config not initialized")

    return {
        "sglang_image": app_config.sglang_image,
        "vllm_image": app_config.vllm_image,
        "tabby_image": app_config.tabby_image,
        "lmdeploy_image": app_config.lmdeploy_image,
        "openvino_image": app_config.openvino_image,
        "gateway_image": app_config.gateway_image,
    }


@router.get("/api/worker-urls")
async def get_worker_urls():
    if model_manager is None:
        raise HTTPException(status_code=500, detail="Model manager not initialized")

    return {"worker_urls": model_manager.get_worker_urls()}


@router.get("/api/backend/types")
async def get_backend_types():
    return {
        "types": [
            {"value": t.value, "label": t.name}
            for t in InferenceBackendType
        ]
    }


@router.get("/api/policy/types")
async def get_policy_types():
    return {
        "types": [
            {"value": p.value, "label": p.name}
            for p in LoadBalancingPolicy
        ]
    }
