#!/usr/bin/env python3
import uvicorn
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from gateway_manager.main import app

if __name__ == "__main__":
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=28088,
        log_level="info",
    )
