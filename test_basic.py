#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

def test_imports():
    print("Testing imports...")
    from gateway_manager.models.schemas import (
        InferenceBackendType, ContainerStatus, LoadBalancingPolicy,
        BaseModelConfig, SGLangConfig, ModelInstance, GatewayConfig, AppConfig
    )
    print("✓ Schemas imported successfully")

    from gateway_manager.core.backend_manager import (
        BackendManagerFactory, SGLangManager
    )
    print("✓ Backend managers imported successfully")

    from gateway_manager.core.docker_manager import DockerManager
    print("✓ Docker manager imported successfully")

    return True

def test_schemas():
    print("\nTesting schemas...")

    from gateway_manager.models.schemas import BaseModelConfig, SGLangConfig, GatewayConfig, LoadBalancingPolicy

    config = BaseModelConfig(
        model_path="/data/models/test",
        served_model_name="test-model",
        port=30000
    )
    assert config.model_path == "/data/models/test"
    print("✓ BaseModelConfig works")

    sglang_config = SGLangConfig(
        model_path="/data/models/test",
        served_model_name="test-model"
    )
    assert sglang_config.max_batch_size == 128
    print("✓ SGLangConfig works")

    gateway = GatewayConfig(
        worker_urls=["http://localhost:30000"],
        policy=LoadBalancingPolicy.CACHE_AWARE
    )
    assert len(gateway.worker_urls) == 1
    assert gateway.policy == LoadBalancingPolicy.CACHE_AWARE
    print("✓ GatewayConfig works")

    return True

def test_backend_managers():
    print("\nTesting backend managers...")

    from gateway_manager.core.backend_manager import BackendManagerFactory
    from gateway_manager.models.schemas import InferenceBackendType, SGLangConfig

    sglang_config = SGLangConfig(
        model_path="/data/models/Qwen3-35B",
        served_model_name="qwen3.5",
        host="0.0.0.0",
        port=30000,
        tensor_parallel=1,
        gpu_ids=[0, 1]
    )

    manager = BackendManagerFactory.create_manager(
        InferenceBackendType.SGLANG,
        sglang_config,
        "lmsysorg/sglang:v0.5.10"
    )

    cmd = manager.build_command()
    assert "--model-path /data/models/Qwen3-35B" in cmd
    assert "--served-model-name qwen3.5" in cmd
    assert "--port 30000" in cmd
    print(f"✓ SGLang command: {cmd[:80]}...")

    ports = manager.build_ports()
    assert "30000/tcp" in ports
    print("✓ SGLang ports configured correctly")

    return True

if __name__ == "__main__":
    try:
        test_imports()
        test_schemas()
        test_backend_managers()
        print("\n✅ All tests passed!")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
