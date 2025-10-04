import re
from typing import List, Dict

# ---------------- Split Text into Sections ----------------
def split_into_sections(text: str) -> List[Dict[str, str]]:
    """
    Splits text into sections based on headings.

    Heuristics:
    - Headings are lines that are all caps, numbered (1. , 1.1), or bold-like patterns.
    - Each heading is followed by content until the next heading.
    """
    sections = []
    
    # Normalize line breaks
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    
    heading_pattern = re.compile(r"^(\d+(\.\d+)*\s+.*|[A-Z][A-Z\s]{2,})$")  
    # Matches numbered headings (1., 1.1) or all caps
    
    current_heading = "Introduction"
    current_content = []

    for line in lines:
        if heading_pattern.match(line):
            if current_content:
                sections.append({
                    "heading": current_heading,
                    "content": " ".join(current_content).strip()
                })
            current_heading = line
            current_content = []
        else:
            current_content.append(line)

    # Append last section
    if current_content:
        sections.append({
            "heading": current_heading,
            "content": " ".join(current_content).strip()
        })

    return sections
