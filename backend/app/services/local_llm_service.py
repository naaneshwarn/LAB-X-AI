"""Lightweight Local LLM Provider for LabXAI (zero Ollama dependency, zero auto-downloads).

Supports two lightweight local execution modes designed for 12 GB RAM / 4 GB VRAM laptops:
1. In-process quantized GGUF via `llama-cpp-python` (CPU by default, optional GPU layers).
2. Local OpenAI-compatible HTTP server (`llama-server` from llama.cpp or LM Studio).

Recommended model for Lenovo LOQ (i5-12450HX, RTX 2050 4 GB VRAM, 12 GB RAM):
- Qwen2.5-1.5B-Instruct-Q4_K_M.gguf (~1.1 GB disk, ~1.8 GB RAM on CPU, ~1.6 GB VRAM on GPU)
  Strong multilingual instruction following across English, Kannada, Hindi, Tamil, and Telugu.
"""

from __future__ import annotations

import asyncio
import importlib.util
import time
from pathlib import Path
from typing import Any

import httpx

from app.core.config import Settings, get_settings

RECOMMENDED_MODEL = {
    "name": "Qwen2.5-1.5B-Instruct-Q4_K_M.gguf",
    "parameters": "1.5B (Q4_K_M quantized GGUF)",
    "disk_size_gb": 1.1,
    "estimated_ram_gb": 1.8,
    "estimated_vram_gb": 1.6,
    "cpu_supported": True,
    "install_commands": [
        "backend\\.venv\\Scripts\\python.exe -m pip install llama-cpp-python",
        "# Download Qwen2.5-1.5B-Instruct-Q4_K_M.gguf from Hugging Face (Qwen/Qwen2.5-1.5B-Instruct-GGUF)",
        "# Set LOCAL_LLM_MODEL_PATH=C:\\path\\to\\Qwen2.5-1.5B-Instruct-Q4_K_M.gguf in backend/.env",
    ],
}


class LocalLlmService:
    """Thread-safe lazy loader & inference client for lightweight local GGUF / llama-server models."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()
        self._llm_instance: Any = None
        self._loading: bool = False
        self._load_error: str | None = None
        self._load_time_ms: float | None = None
        self._probe_cache: tuple[float, bool, str | None] | None = None
        self._lock = asyncio.Lock()

    @staticmethod
    def is_llama_cpp_installed() -> bool:
        return importlib.util.find_spec("llama_cpp") is not None

    def _model_file_exists(self) -> bool:
        p = (self.settings.local_llm_model_path or "").strip()
        return bool(p) and Path(p).is_file()

    def is_enabled(self) -> bool:
        flag = (self.settings.local_llm_enabled or "auto").strip().lower()
        return flag != "false"

    async def probe_openai_compat_server(self, client: httpx.AsyncClient | None = None) -> tuple[bool, str | None]:
        """Quick non-blocking health probe with 30s negative cache to avoid Windows refused-port lag."""
        base = (self.settings.local_llm_server_url or "").strip().rstrip("/")
        if not base:
            return False, None
        now = time.monotonic()
        if client is None and self._probe_cache is not None:
            ts, ok, cached_model = self._probe_cache
            if (now - ts) < 30.0:
                return ok, cached_model

        url = f"{base}/models"
        try:
            if client is not None:
                resp = await client.get(url, timeout=0.4)
            else:
                async with httpx.AsyncClient(timeout=0.4) as c:
                    resp = await c.get(url)
            if resp.status_code == 200:
                data = resp.json()
                models = data.get("data") or []
                model_id = models[0].get("id") if models and isinstance(models[0], dict) else self.settings.local_llm_model_name
                res = (True, str(model_id or self.settings.local_llm_model_name))
                if client is None:
                    self._probe_cache = (now, res[0], res[1])
                return res
        except Exception:
            pass
        if client is None:
            self._probe_cache = (now, False, None)
        return False, None

    async def get_status(self, client: httpx.AsyncClient | None = None) -> dict[str, Any]:
        """Return honest local AI availability & setup guidance without ever faking readiness."""
        if not self.is_enabled():
            return {
                "available": False,
                "status": "disabled",
                "backend": None,
                "model_name": self.settings.local_llm_model_name,
                "loading": False,
                "load_time_ms": None,
                "message": "Local LLM is disabled via LOCAL_LLM_ENABLED=false.",
                "recommended_model": RECOMMENDED_MODEL,
            }

        backend_pref = (self.settings.local_llm_backend or "auto").strip().lower()

        # 1. Check in-process GGUF via llama-cpp-python
        if backend_pref in ("auto", "llama_cpp"):
            has_pkg = self.is_llama_cpp_installed()
            has_file = self._model_file_exists()
            if has_pkg and has_file:
                return {
                    "available": True,
                    "status": "loading" if self._loading else ("ready" if self._llm_instance else "installed_lazy"),
                    "backend": "llama_cpp",
                    "model_name": Path(self.settings.local_llm_model_path).name,
                    "loading": self._loading,
                    "load_time_ms": self._load_time_ms,
                    "message": (
                        "Local GGUF model is loaded and ready."
                        if self._llm_instance
                        else "Local GGUF model detected and will load lazily on first request."
                    ),
                    "recommended_model": RECOMMENDED_MODEL,
                }

        # 2. Check OpenAI-compatible local server (llama-server / LM Studio)
        if backend_pref in ("auto", "openai_compat"):
            reachable, active_model = await self.probe_openai_compat_server(client=client)
            if reachable:
                return {
                    "available": True,
                    "status": "ready",
                    "backend": "openai_compat",
                    "model_name": active_model or self.settings.local_llm_model_name,
                    "loading": False,
                    "load_time_ms": 0.0,
                    "message": f"Connected to local inference server at {self.settings.local_llm_server_url}.",
                    "recommended_model": RECOMMENDED_MODEL,
                }

        # 3. Not installed / not running — report honestly with exact setup instructions
        reason = (
            "No local GGUF model file configured (set LOCAL_LLM_MODEL_PATH) and no local inference server "
            f"reachable at {self.settings.local_llm_server_url}."
            if self.is_llama_cpp_installed()
            else "No local LLM runtime installed (optional: install llama-cpp-python with a Q4_K_M GGUF model or start llama-server)."
        )
        return {
            "available": False,
            "status": "not_installed",
            "backend": None,
            "model_name": self.settings.local_llm_model_name,
            "loading": False,
            "load_time_ms": self._load_time_ms,
            "message": reason,
            "recommended_model": RECOMMENDED_MODEL,
        }

    async def _ensure_llama_cpp_loaded(self) -> Any:
        if self._llm_instance is not None:
            return self._llm_instance
        async with self._lock:
            if self._llm_instance is not None:
                return self._llm_instance
            self._loading = True
            self._load_error = None
            t0 = time.perf_counter()
            try:
                def _load_sync() -> Any:
                    from llama_cpp import Llama  # type: ignore[import-not-found]

                    return Llama(
                        model_path=self.settings.local_llm_model_path,
                        n_ctx=self.settings.local_llm_n_ctx,
                        n_gpu_layers=self.settings.local_llm_n_gpu_layers,
                        n_threads=self.settings.local_llm_threads,
                        verbose=False,
                    )

                self._llm_instance = await asyncio.to_thread(_load_sync)
                self._load_time_ms = round((time.perf_counter() - t0) * 1000.0, 1)
                return self._llm_instance
            except Exception as exc:
                self._load_error = str(exc)
                raise
            finally:
                self._loading = False

    async def generate_chat(
        self,
        *,
        messages: list[dict[str, str]],
        max_tokens: int = 512,
        temperature: float = 0.4,
        client: httpx.AsyncClient | None = None,
    ) -> dict[str, Any] | None:
        """Attempt generation via local GGUF or local OpenAI-compatible server.

        Returns None when no local model is installed/running so the caller falls back cleanly.
        """
        if not self.is_enabled():
            return None

        backend_pref = (self.settings.local_llm_backend or "auto").strip().lower()

        # Path A: Direct in-process GGUF via llama-cpp-python
        if backend_pref in ("auto", "llama_cpp") and self.is_llama_cpp_installed() and self._model_file_exists():
            t0 = time.perf_counter()
            llm = await self._ensure_llama_cpp_loaded()

            def _infer_sync() -> dict[str, Any]:
                return llm.create_chat_completion(
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                )

            out = await asyncio.wait_for(
                asyncio.to_thread(_infer_sync),
                timeout=self.settings.local_llm_timeout_seconds,
            )
            content = (out.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
            if content:
                return {
                    "reply": content,
                    "model": Path(self.settings.local_llm_model_path).name,
                    "backend": "llama_cpp",
                    "latency_ms": round((time.perf_counter() - t0) * 1000.0, 1),
                    "load_time_ms": self._load_time_ms,
                }

        # Path B: Local OpenAI-compatible HTTP server (llama-server / LM Studio)
        if backend_pref in ("auto", "openai_compat"):
            reachable, active_model = await self.probe_openai_compat_server(client=client)
            if reachable:
                t0 = time.perf_counter()
                url = f"{self.settings.local_llm_server_url.rstrip('/')}/chat/completions"
                payload = {
                    "model": active_model or self.settings.local_llm_model_name,
                    "messages": messages,
                    "temperature": temperature,
                    "max_tokens": max_tokens,
                }
                if client is not None:
                    resp = await client.post(url, json=payload, timeout=self.settings.local_llm_timeout_seconds)
                else:
                    async with httpx.AsyncClient(timeout=self.settings.local_llm_timeout_seconds) as c:
                        resp = await c.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    content = (data.get("choices", [{}])[0].get("message", {}).get("content") or "").strip()
                    if content:
                        return {
                            "reply": content,
                            "model": data.get("model", active_model or self.settings.local_llm_model_name),
                            "backend": "openai_compat",
                            "latency_ms": round((time.perf_counter() - t0) * 1000.0, 1),
                            "load_time_ms": 0.0,
                        }

        return None


# Shared singleton instance so a loaded GGUF model stays warm across requests
_default_local_llm_service: LocalLlmService | None = None


def get_local_llm_service(settings: Settings | None = None) -> LocalLlmService:
    global _default_local_llm_service
    default_cfg = get_settings()
    if settings is not None and settings is not default_cfg:
        return LocalLlmService(settings)
    if _default_local_llm_service is None:
        _default_local_llm_service = LocalLlmService(default_cfg)
    return _default_local_llm_service
