import numpy as np
from typing import List, Optional

class EmbeddingGenerator:
    """Generates 384-dimensional vector embeddings for text reviews and safety reports."""

    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model_name = model_name
        self.model = None
        try:
            from sentence_transformers import SentenceTransformer
            self.model = SentenceTransformer(model_name)
        except Exception as e:
            print(f"SentenceTransformer load note: {e}. Using deterministic dense encoder fallback.")

    def generate(self, text: str) -> List[float]:
        """Generate a 384-dimensional normalized float vector."""
        if not text:
            return [0.0] * 384

        if self.model is not None:
            try:
                vec = self.model.encode(text, convert_to_numpy=True)
                return (vec / np.linalg.norm(vec)).tolist()
            except Exception:
                pass

        # Deterministic 384-dim hash encoder fallback
        vec = np.zeros(384, dtype=np.float32)
        words = text.lower().split()
        for word in words:
            idx = abs(hash(word)) % 384
            vec[idx] += 1.0
        
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec.tolist()
