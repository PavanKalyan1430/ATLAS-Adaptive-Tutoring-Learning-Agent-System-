from itertools import cycle
from llama_index.llms.groq import Groq
from llama_index.core import Settings as LlamaIndexSettings
from skillforge.app.core.config import settings
import time
import logging

logger = logging.getLogger("SkillForge.LLM")

# Groq round-robin key pool (supports up to 6 concurrent keys)
GROQ_KEYS = [
    settings.GROQ_API_KEY_1,
    settings.GROQ_API_KEY_2,
    settings.GROQ_API_KEY_3,
    settings.GROQ_API_KEY_4,
    settings.GROQ_API_KEY_5,
    settings.GROQ_API_KEY_6,
]
# Filter out any unconfigured or blank keys
GROQ_KEYS = [k for k in GROQ_KEYS if k and k.strip()]
GROQ_KEY_POOL = cycle(GROQ_KEYS)

def _build_groq(api_key: str, model: str, temperature: float) -> Groq:
    """Helper to instantiate a Groq LLM client."""
    return Groq(
        model=model,
        api_key=api_key,
        temperature=temperature,
    )

class ResilientGroqLLM:
    """
    Round-robin across 3 Groq keys for lightning-fast, rate-limit-proof calls.
    Cycles through API keys if one gets rate-limited.
    """
    def __init__(self, model: str, temperature: float = 0.1):
        self.model = model
        self.temperature = temperature
        self.clients = []
        for key in GROQ_KEYS:
            if key and key.strip():
                self.clients.append(_build_groq(key, self.model, self.temperature))
        
        if not self.clients:
            logger.error("❌ No valid Groq keys found in key pool!")
            raise ValueError("Groq keys not initialized in environment config.")
            
        self.current_index = 0

    def complete(self, prompt: str) -> object:
        num_keys = len(self.clients)
        for attempt in range(num_keys * 2): 
            client = self.clients[self.current_index]
            self.current_index = (self.current_index + 1) % num_keys
            try:
                logger.info(f"LLM: Calling Groq ({self.model})...")
                return client.complete(prompt)
            except Exception as e:
                error_str = str(e)
                if "429" in error_str or "rate" in error_str.lower() or "limit" in error_str.lower():
                    logger.warning("Groq key rate-limited, rotating to next key in pool...")
                    time.sleep(0.5)
                    continue
                raise e

        logger.error(f"All Groq keys rate-limited for {self.model}.")
        raise Exception("All Groq API keys are currently rate-limited. Please wait and try again.")


class LLMService:
    def __init__(self):
        # Fast LLM for grading/rewriting/checking
        self.fast_llm = ResilientGroqLLM(model=settings.FAST_LLM_MODEL, temperature=0.1)
        # Smart LLM for path rationale, advanced feedback and explanation
        self.smart_llm = ResilientGroqLLM(model=settings.SMART_LLM_MODEL, temperature=0.3)

        # Register a single Groq instance globally for LlamaIndex internals
        LlamaIndexSettings.llm = _build_groq(GROQ_KEYS[0], settings.FAST_LLM_MODEL, 0.1)
        logger.info("LLM Service initialized successfully for SkillForge.")

    def get_fast_llm(self) -> ResilientGroqLLM:
        return self.fast_llm

    def get_smart_llm(self) -> ResilientGroqLLM:
        return self.smart_llm
