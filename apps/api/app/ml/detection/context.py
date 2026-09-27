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
    r"\bcustomer service\b",
    r"\baudio bleeding\b",
    r"\bsound bleeding\b",
    r"\bbleeding audio\b",
    r"\bbleeding sound\b",
    r"\bcolor bleeding\b",
    r"\blight bleeding\b",
    r"\bbleeding through\b",
    r"\bbleeding into\b",
    r"\bprotect.*bleeding\b",
    r"\bprevent.*bleeding\b",
    r"\bstop.*bleeding\b"
]

def is_false_positive_context(text: str, matched_keyword: str) -> bool:
    """Returns True if the matched keyword occurs in a non-product-safety context."""
    text_lower = text.lower()
    for fp_pat in FALSE_POSITIVE_PATTERNS:
        if re.search(fp_pat, text_lower):
            # Check if the matched keyword is part of the false positive phrase
            if matched_keyword in ["burnt", "burn", "shock", "fire", "hot", "bleeding", "injury", "fall"]:
                return True

    # Audio equipment acoustic domain check for "bleeding"
    if matched_keyword in ["bleeding", "injury"]:
        audio_terms = ["audio", "sound", "speaker", "monitor", "pad", "mopad", "acoustic", "mic", "headphone", "track"]
        if any(term in text_lower for term in audio_terms):
            physical_injuries = ["cut", "wound", "blood", "skin", "finger", "hand", "hospital", "laceration", "doctor"]
            if not any(inj in text_lower for inj in physical_injuries):
                return True

    return False

