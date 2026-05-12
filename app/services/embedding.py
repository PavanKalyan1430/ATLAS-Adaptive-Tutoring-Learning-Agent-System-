from typing import List
from llama_index.embeddings.fastembed import FastEmbedEmbedding
from llama_index.core import Settings as LlamaIndexSettings

class EmbeddingService:
    def __init__(self):
        # 1. Initialize the embedding model using FastEmbed
        # FastEmbed is written in Rust and uses the ONNX Runtime for extreme CPU optimization.
        # It is up to 10x faster than HuggingFace's standard PyTorch implementations on CPUs!
        self.embed_model = FastEmbedEmbedding(model_name="BAAI/bge-base-en-v1.5")
        
        # 2. Register it globally in LlamaIndex
        LlamaIndexSettings.embed_model = self.embed_model

    def embed_text(self, text: str) -> List[float]:
        """Manually embed a single string (useful for chat queries)."""
        return self.embed_model.get_text_embedding(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of text chunks simultaneously for faster processing."""
        return self.embed_model.get_text_embedding_batch(texts)
        
    def get_model(self) -> FastEmbedEmbedding:
        """Returns the raw LlamaIndex-compatible embedding object."""
        return self.embed_model
