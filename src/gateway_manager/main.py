import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
from starlette.requests import Request
from loguru import logger

from gateway_manager.core.config_manager import ConfigManager
from gateway_manager.core.model_manager import ModelManager
from gateway_manager.core.gateway_manager import GatewayManager
from gateway_manager.api.routes import router, init_managers

_base_dir = os.path.dirname(os.path.abspath(__file__))


def get_html(filename: str) -> str:
    filepath = os.path.join(_base_dir, "templates", filename)
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


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
    description="SGL-Model-Gateway 可视化管理界面",
    version="1.0.0",
    lifespan=lifespan,
)

app.include_router(router)

static_dir = os.path.join(_base_dir, "static")
if os.path.exists(static_dir):
    app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return HTMLResponse(content=get_html("index.html"))


@app.get("/models", response_class=HTMLResponse)
async def models_page(request: Request):
    return HTMLResponse(content=get_html("models.html"))


@app.get("/gateway", response_class=HTMLResponse)
async def gateway_page(request: Request):
    return HTMLResponse(content=get_html("gateway.html"))


@app.get("/settings", response_class=HTMLResponse)
async def settings_page(request: Request):
    return HTMLResponse(content=get_html("settings.html"))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=18088)
