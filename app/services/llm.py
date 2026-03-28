import os
from groq import Groq
from typing import List
from dotenv import load_dotenv

load_dotenv()

class LLMService:
    def __init__(self):
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment variables.")
        self.client = Groq(api_key=api_key)
        self.model = os.getenv("LLM_MODEL", "llama-3.1-8b-instant")

    def generate_answer(self, question: str, context_chunks: List[str]) -> str:
        """Generates an answer using the provided context and strict prompting."""
        # Removed "--- Chunk X ---" formatting to prevent the LLM from knowing it's read chunks
        context_text = "\n\n".join(context_chunks)
        
        prompt = f"""You are an intelligent document analysis assistant.

You have been augmented with specific information retrieved from a document based on the user's query.
Use this information to answer the user's question conversationally, clearly, and completely.

CRITICAL RULES:
1. NEVER mention words like "chunk", "context", "provided text", or "source document" in your answer.
2. Just answer the question directly as if you knew it all along.
3. If the answer cannot be reasonably inferred from the information below, simply state: 'I don't have enough information to answer that.'

Information:
{context_text}

Question:
{question}

Answer:
Provide a helpful, precise, and direct answer based on the Information.

Sources:
At the very end of your response, on a new line, list the page numbers where you found the information (e.g., "Sources: Page X")."""

        print("\n--- LLM PROMPT DIAGNOSTICS ---")
        print("Prompt size (chars):", len(prompt))
        print("Context used:", len(context_chunks), "chunks")
        print("------------------------------\n")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are a highly capable AI assistant that uses provided search results to assist users."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3, # Bumped up slightly for better synthesis
            max_tokens=600
        )

        return response.choices[0].message.content

