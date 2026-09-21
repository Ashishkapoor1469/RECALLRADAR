from typing import List, Dict, Any

INSTRUMENT_DEFECT_LEXICON = {
    "cable noise": ["noise", "static", "buzz", "hum", "interference", "ground loop", "cable noise", "noisy cord"],
    "crackling/electrical": ["crackling", "popping", "sparked", "short circuit", "electric shock", "shocked", "bad jack", "bad connector", "intermittent connection"],
    "component detachment": ["fell out", "detached", "loose", "came off", "knob fell", "screw fell", "mount loose", "clamp slipped", "strap snapped", "unclasped"],
    "breakage/durability": ["broke", "broken", "cheap plastic", "snapped", "cracked", "bent", "failed", "died", "stopped working", "fell apart"],
    "sound quality": ["muffled", "distortion", "thin sound", "horrible tone", "muddy", "out of tune", "buzzing fret"]
}

def classify_review_signals(text: str) -> List[Dict[str, Any]]:
    if not text:
        return []

    text_lower = text.lower()
    signals = []

    for category, keywords in INSTRUMENT_DEFECT_LEXICON.items():
        for kw in keywords:
            if kw in text_lower:
                signals.append({
                    "category": category,
                    "keyword": kw,
                    "sentiment": "negative"
                })
                break  # match top keyword per category

    return signals
