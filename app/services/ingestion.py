import uuid
from typing import List
import fitz  # PyMuPDF - blazing fast text extraction
from llama_index.core.node_parser import MarkdownNodeParser
from llama_index.core import Document
from app.models.schemas import ChunkSchema, ChunkMetadata, ContentType
import logging

logger = logging.getLogger("A.R.C.H.E.R.Ingestion")


class IngestionService:
    def __init__(self):
        # LlamaIndex parser: Splits text intelligently by Markdown headers (#, ##)
        self.node_parser = MarkdownNodeParser()

    def _extract_text_from_pdf(self, pdf_path: str) -> str:
        """
        Extract text from PDF using PyMuPDF.
        Fast, reliable, and handles 99% of text-based PDFs perfectly.
        For scanned/image PDFs, we can add OCR as a fallback later.
        """
        doc = fitz.open(pdf_path)
        full_text = ""
        
        for page_num, page in enumerate(doc):
            text = page.get_text("text")
            if text.strip():
                # Add a markdown header for each page to preserve page boundaries
                full_text += f"\n## Page {page_num + 1}\n\n{text}\n"
        
        doc.close()
        return full_text.strip()

    def _detect_tables_in_text(self, text: str) -> bool:
        """Basic heuristic to detect if a chunk likely contains a table."""
        lines = text.strip().split("\n")
        # Check for consistent pipe-separated or tab-separated lines
        pipe_lines = sum(1 for line in lines if "|" in line and line.count("|") >= 2)
        return pipe_lines >= 3

    def process_document(self, pdf_path: str, filename: str) -> List[ChunkSchema]:
        """
        Parses a PDF using PyMuPDF for fast text extraction,
        and chunks semantically using LlamaIndex's MarkdownNodeParser.
        """
        doc_id = str(uuid.uuid4())
        logger.info(f"📄 Processing: {filename} (doc_id: {doc_id})")
        
        # 1. Extract text from PDF (fast - takes 1-2 seconds)
        extracted_text = self._extract_text_from_pdf(pdf_path)
        logger.info(f"  → Extracted {len(extracted_text)} characters from PDF")
        
        if not extracted_text.strip():
            logger.warning(f"  ⚠️ No text extracted from {filename}. It may be a scanned/image PDF.")
            return []
        
        # 2. Wrap in LlamaIndex Document object
        llama_doc = Document(
            text=extracted_text, 
            metadata={"filename": filename, "doc_id": doc_id}
        )
        
        # 3. Intelligent Semantic Chunking by Markdown headers
        nodes = self.node_parser.get_nodes_from_documents([llama_doc])
        logger.info(f"  → Created {len(nodes)} semantic chunks")
        
        chunks = []
        for i, node in enumerate(nodes):
            # Detect content type
            is_table = self._detect_tables_in_text(node.text)
            content_type = ContentType.TABLE if is_table else ContentType.TEXT
            
            # Extract section heading from metadata
            header_keys = [k for k in node.metadata.keys() if "Header" in k]
            section_heading = node.metadata[header_keys[-1]] if header_keys else "General"
            
            chunk = ChunkSchema(
                chunk_id=f"{doc_id}_chunk_{i}",
                text=node.text.strip(),
                metadata=ChunkMetadata(
                    doc_id=doc_id,
                    filename=filename,
                    page=1,
                    content_type=content_type,
                    section_heading=section_heading
                )
            )
            chunks.append(chunk)
        
        logger.info(f"  ✅ Ingestion complete: {len(chunks)} chunks created for {filename}")
        return chunks
