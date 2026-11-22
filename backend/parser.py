import io
from pypdf import PdfReader
from docx import Document

def extract_text_from_pdf(file_bytes: bytes) -> str:
    try:
        stream = io.BytesIO(file_bytes)
        reader = PdfReader(stream)
        if reader.is_encrypted:
            raise ValueError("The provided PDF file is password protected/encrypted.")
        
        extracted_text = []
        for index, page in enumerate(reader.pages):
            page_text = page.extract_text()
            if page_text:
                extracted_text.append(page_text.strip())
        
        full_text = "\n\n".join(extracted_text).strip()
        if not full_text:
            raise ValueError("No readable text found in the PDF. It may be scanned or image-based.")
        return full_text
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to parse PDF document: {str(e)}")

def extract_text_from_docx(file_bytes: bytes) -> str:
    try:
        stream = io.BytesIO(file_bytes)
        doc = Document(stream)
        extracted_text = []

        # Extract text from standard paragraphs
        for paragraph in doc.paragraphs:
            text = paragraph.text.strip()
            if text:
                extracted_text.append(text)

        # Also extract text from tables
        for table in doc.tables:
            for row in table.rows:
                cells = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if cells:
                    # Remove duplicates if merged cells exist in docx
                    deduped_cells = []
                    for c in cells:
                        if not deduped_cells or c != deduped_cells[-1]:
                            deduped_cells.append(c)
                    extracted_text.append(" | ".join(deduped_cells))

        full_text = "\n\n".join(extracted_text).strip()
        if not full_text:
            raise ValueError("No readable text found in the DOCX document.")
        return full_text
    except Exception as e:
        if isinstance(e, ValueError):
            raise e
        raise ValueError(f"Failed to parse DOCX document: {str(e)}")

def extract_resume_text(filename: str, file_bytes: bytes) -> str:
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""
    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext == "docx":
        return extract_text_from_docx(file_bytes)
    else:
        raise ValueError(f"Unsupported file format '.{ext}'. Supported formats are: .pdf, .docx")
