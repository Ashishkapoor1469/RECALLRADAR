import re

FALSE_POSITIVE_PATTERNS = [
    r"\bburnt toast\b",
    r"\bburnt coffee\b",
    r"\bburnt food\b",
    r"\bshocking price\b",
    r"\bshocking value\b",
    r"\bfire deal\b",
    r"\bfire price\b",
    r"\bhot item\b",
    r"\bhot deal\b",
    r"\bhot product\b",
    r"\bbattery life\b",
    r"\bshipping was\b",
    r"\bcolor is wrong\b",
    r"\bpackage arrived\b",
    r"\bcustomer service\b"
]

def is_false_positive_context(text: str, matched_keyword: str) -> bool:
    """Returns True if the matched keyword occurs in a non-product-safety context."""
    text_lower = text.lower()
    for fp_pat in FALSE_POSITIVE_PATTERNS:
        if re.search(fp_pat, text_lower):
            # Check if the matched keyword is part of the false positive phrase
            if matched_keyword in ["burnt", "burn", "shock", "fire", "hot"]:
                return True
    return False
