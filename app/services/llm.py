from itertools import cycle
from llama_index.llms.groq import Groq
from llama_index.llms.openai_like import OpenAILike
from llama_index.core import Settings as LlamaIndexSettings
from app.core.config import settings
import time
import logging

logger = logging.getLogger("A.R.C.H.E.R.LLM")

# Groq round-robin key pool for fast agent tasks (Rewriter, Grader, Hallucination Checker)
GROQ_KEYS = [
    settings.GROQ_API_KEY_1,
    settings.GROQ_API_KEY_2,
    settings.GROQ_API_KEY_3,
]
GROQ_KEY_POOL = cycle(GROQ_KEYS)

# OpenRouter fallback models for smart answer generation
OPENROUTER_SMART_MODELS = [
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
]

GROQ_FAST_MODEL = "llama-3.1-8b-instant"


def _build_groq(api_key: str) -> Groq:
    return Groq(
        model=GROQ_FAST_MODEL,
        api_key=api_key,
        temperature=0.1,
    )


def _build_openrouter(model: str) -> OpenAILike:
    return OpenAILike(
        model=model,
        api_key=settings.OPENROUTER_API_KEY,
        api_base="https://openrouter.ai/api/v1",
        temperature=0.3,
        is_chat_model=True,
        timeout=90,
    )


class ResilientFastLLM:
    """
    Round-robin across 3 Groq keys for lightning-fast, rate-limit-proof agent calls.
    Falls back to OpenRouter if all Groq keys are exhausted.
    """

    def complete(self, prompt: str) -> object:
        # Try each Groq key in round-robin order
        for _ in range(len(GROQ_KEYS)):
            api_key = next(GROQ_KEY_POOL)
            try:
                logger.info("FastLLM: Calling Groq (%s...)", api_key[-6:])
                result = _build_groq(api_key).complete(prompt)
                return result
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "rate" in error_str.lower():
                    logger.warning("Groq key rate-limited, rotating to next key...")
                    time.sleep(0.5)
                    continue
                raise e

        # All Groq keys exhausted — fall back to OpenRouter fast model
        logger.warning("All Groq keys rate-limited. Falling back to OpenRouter.")
        return _build_openrouter("meta-llama/llama-3.2-3b-instruct:free").complete(prompt)


class ResilientSmartLLM:
    """
    Uses OpenRouter with model fallback chain for high-quality answer generation.
    Falls back to Groq if OpenRouter is also rate-limited.
    """

    def complete(self, prompt: str) -> object:
        # Try each OpenRouter smart model
        for model in OPENROUTER_SMART_MODELS:
            try:
                logger.info("SmartLLM: Calling OpenRouter model: %s", model)
                result = _build_openrouter(model).complete(prompt)
                return result
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "rate" in error_str.lower() or "timeout" in error_str.lower():
                    logger.warning("OpenRouter model %s rate-limited, trying next...", model)
                    time.sleep(1)
                    continue
                raise e

        # Final fallback: use Groq for smart generation too
        logger.warning("All OpenRouter models exhausted. Using Groq as final fallback.")
        api_key = next(GROQ_KEY_POOL)
        return _build_groq(api_key).complete(prompt)


class LLMService:
    def __init__(self):
        self.fast_llm = ResilientFastLLM()
        self.smart_llm = ResilientSmartLLM()

        # Register a single Groq instance globally for LlamaIndex internals
        LlamaIndexSettings.llm = _build_groq(GROQ_KEYS[0])
        logger.info(
            "LLM Service initialized: 3-key Groq pool (Fast) + OpenRouter fallback chain (Smart)."
        )

    def get_fast_llm(self) -> ResilientFastLLM:
        return self.fast_llm

    def get_smart_llm(self) -> ResilientSmartLLM:
        return self.smart_llm
