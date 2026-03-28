import fitz  # PyMuPDF
import re
import uuid
from typing import List
from app.models.schemas import DocumentMetadata

class IngestionService:
    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 150):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def extract_text_from_pdf(self, pdf_path: str) -> List[dict]:
        """Extracts text page-wise from a PDF, removing extra whitespaces."""
        doc = fitz.open(pdf_path)
        pages_content = []
        for i, page in enumerate(doc):
            text = page.get_text("text")
            cleaned_text = self.clean_text(text)
            if cleaned_text:
                pages_content.append({"page": i + 1, "text": cleaned_text})
        doc.close()
        return pages_content

    def clean_text(self, text: str) -> str:
        """Normalizes text by removing extra whitespaces, basic headers/footers rules."""
        # Replace multiple whitespaces/newlines with a single space
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    def create_chunks(self, pages_content: List[dict], filename: str) -> List[DocumentMetadata]:
        """Semantic chunking: split by sentences/paragraphs rather than raw characters."""
        chunks = []
        doc_id = str(uuid.uuid4())
        chunk_id_counter = 0

        for page in pages_content:
            text = page["text"]
            page_num = page["page"]
            
            # Split by basic sentence boundaries to avoid breaking mid-sentence
            sentences = re.split(r'(?<=[.!?]) +', text)
            
            current_chunk = ""
            for sentence in sentences:
                # If adding the next sentence exceeds chunk size, save current chunk
                if len(current_chunk) + len(sentence) > self.chunk_size and len(current_chunk) > 0:
                    chunks.append(DocumentMetadata(
                        doc_id=doc_id,
                        page=page_num,
                        chunk_id=chunk_id_counter,
                        text=current_chunk.strip(),
                        source=filename
                    ))
                    chunk_id_counter += 1
                    
                    # Create overlap by keeping the end of the previous chunk
                    overlap_start = max(0, len(current_chunk) - self.chunk_overlap)
                    # We approximate overlap by taking the last N characters of current chunk
                    # A better way would be word-based, but character based works here.
                    overlap_text = current_chunk[overlap_start:]
                    # Ensure we don't start mid-word in the overlap
                    first_space = overlap_text.find(' ')
                    if first_space != -1:
                        overlap_text = overlap_text[first_space+1:]
                        
                    current_chunk = overlap_text + " " + sentence
                else:
                    if current_chunk:
                        current_chunk += " " + sentence
                    else:
                        current_chunk = sentence
                        
            # Add the last chunk if not empty
            if current_chunk.strip():
                chunks.append(DocumentMetadata(
                    doc_id=doc_id,
                    page=page_num,
                    chunk_id=chunk_id_counter,
                    text=current_chunk.strip(),
                    source=filename
                ))
                chunk_id_counter += 1
                    
        return chunks
