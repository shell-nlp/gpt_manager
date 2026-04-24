import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from gateway_manager.core.config_manager import ConfigManager
from gateway_manager.core.model_manager import ModelManager
from gateway_manager.core.gateway_manager import GatewayManager
from gateway_manager.api.routes import router, init_managers

_base_dir = os.path.dirname(os.path.abspath(__file__))


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting Gateway Manager...")

    config_manager = ConfigManager()
    model_manager = ModelManager(config_manager)
    gateway_manager = GatewayManager(config_manager)

    init_managers(model_manager, gateway_manager, config_manager)

    logger.info("Gateway Manager started successfully")
    yield

    logger.info("Shutting down Gateway Manager...")


app = FastAPI(
    title="SGL-Model-Gateway Manager",
    description="SGL-Model-Gateway API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=28088)
