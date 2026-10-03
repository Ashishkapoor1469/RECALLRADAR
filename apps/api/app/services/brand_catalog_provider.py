import re
import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

# High-fidelity realistic benchmark catalogs for cold-outreach demonstrations
PRESET_BRAND_CATALOGS: Dict[str, Dict[str, Any]] = {
    "boat": {
        "canonical_name": "boAt",
        "company": "Imagine Marketing Limited",
        "category": "Consumer Audio & Electronics",
        "default_contact_email": "compliance-safety@boat-lifestyle.com",
        "verified_contact": "Gaurav Khatri (Chief Product Officer / Quality Lead)",
        "products": [
            {
                "asin": "B08TV2P1N8",
                "name": "boAt Rockerz 255 Pro+ Bluetooth Neckband",
                "category": "Neckbands & Earphones",
                "reviews": [
                    {
                        "id": "REV-BOAT-001",
                        "date": "2026-08-14",
                        "rating": 1.0,
                        "title": "Severe overheating while charging - melted plastic!",
                        "text": "The neckband battery area gets dangerously hot while charging on a standard 5V wall adapter. Smelled like burning plastic within 15 minutes of plugging in. It began to warp the rubber casing.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-002",
                        "date": "2026-08-28",
                        "rating": 1.0,
                        "title": "Started smoking and sparked",
                        "text": "Unit started smoking while connected to the USB-C charger. Melted the plastic housing right next to the volume controls. Very lucky I was awake to unplug it.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-003",
                        "date": "2026-09-04",
                        "rating": 1.0,
                        "title": "Gave me an electric shock in the ear",
                        "text": "Gave me a shock when I adjusted the right earbud while plugged into my laptop. The internal wire sparked and short circuited. Definite safety issue.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-004",
                        "date": "2026-09-12",
                        "rating": 2.0,
                        "title": "Battery warms up uncomfortably",
                        "text": "Sound is okay but neck piece gets unusually hot around the battery enclosure after 20 minutes of continuous playback.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-005",
                        "date": "2026-09-20",
                        "rating": 1.0,
                        "title": "Burn hazard during fast charge",
                        "text": "Burned my hand when I touched the charging port after 30 minutes of ASAP charge. Dangerously hot adapter connector.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-006",
                        "date": "2026-09-22",
                        "rating": 5.0,
                        "title": "Awesome sound and bass",
                        "text": "Super punchy bass, long battery life, best neckband in this price range.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-007",
                        "date": "2026-09-25",
                        "rating": 4.0,
                        "title": "Good for gym workouts",
                        "text": "IPX7 rating holds up well against sweat. Decent mic quality for quick team calls.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B09N3ZNHTY",
                "name": "boAt Airdopes 141 True Wireless Earbuds",
                "category": "True Wireless Audio",
                "reviews": [
                    {
                        "id": "REV-BOAT-101",
                        "date": "2026-08-19",
                        "rating": 1.0,
                        "title": "Case overheated and warped",
                        "text": "The charging case became extremely hot and burned my skin when taking it off the desk. Charging port smelled like burning plastic.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-102",
                        "date": "2026-09-02",
                        "rating": 1.0,
                        "title": "Right earbud cracked open from heat",
                        "text": "Right earbud battery expanded inside the case. Found it split along the seam after overnight charging. Dangerously hot to touch.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-103",
                        "date": "2026-09-15",
                        "rating": 5.0,
                        "title": "Great value for money",
                        "text": "Crystal clear sound and 42-hour playtime. ENx noise cancellation works as advertised.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-104",
                        "date": "2026-09-18",
                        "rating": 4.0,
                        "title": "Nice bass, decent fit",
                        "text": "Great low latency Beast Mode for mobile gaming. Case is compact.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B07T6XCV49",
                "name": "boAt Stone 650 10W Bluetooth Speaker",
                "category": "Portable Speakers",
                "reviews": [
                    {
                        "id": "REV-BOAT-201",
                        "date": "2026-08-25",
                        "rating": 5.0,
                        "title": "Deep bass and rugged build",
                        "text": "Excellent outdoor speaker. Silicon body is super tough and withstands drops and poolside splashes.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-202",
                        "date": "2026-09-10",
                        "rating": 4.0,
                        "title": "Reliable party speaker",
                        "text": "Sound is very loud for a 10W driver. Battery gives easily 7 hours on medium volume.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-203",
                        "date": "2026-09-21",
                        "rating": 3.0,
                        "title": "Good sound but micro-USB feels outdated",
                        "text": "Port warms up slightly when charging but performs without any problems.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B071Z8M4KX",
                "name": "boAt Bassheads 100 Wired in-Ear Earphones",
                "category": "Wired Audio",
                "reviews": [
                    {
                        "id": "REV-BOAT-301",
                        "date": "2026-08-30",
                        "rating": 5.0,
                        "title": "Best budget wired earphones",
                        "text": "Hawk-inspired design, comfortable earbuds, tangle-free cable and strong mic audio.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOAT-302",
                        "date": "2026-09-14",
                        "rating": 4.0,
                        "title": "Dependable daily driver",
                        "text": "No battery to charge, zero lag on videos, sturdy 3.5mm jack.",
                        "verified": True
                    }
                ]
            }
        ]
    },
    "boult": {
        "canonical_name": "Boult",
        "company": "Boult Audio Technologies",
        "category": "Consumer Audio",
        "default_contact_email": "quality.assurance@boultaudio.com",
        "verified_contact": "Varun Gupta (VP Quality & Manufacturing)",
        "products": [
            {
                "asin": "B07XDNM67L",
                "name": "Boult Audio ProBass Curve Wireless Neckband",
                "category": "Neckbands",
                "reviews": [
                    {
                        "id": "REV-BOULT-001",
                        "date": "2026-08-16",
                        "rating": 1.0,
                        "title": "Caught fire on charging dock!",
                        "text": "The neckband control module caught fire while charging on my nightstand. Thick smoke filled the bedroom before I pulled the plug. Scorched the tabletop.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOULT-002",
                        "date": "2026-08-29",
                        "rating": 1.0,
                        "title": "Severe burn from hot adapter block",
                        "text": "Adapter overheated and burned my hand when trying to disconnect after 20 minutes. Battery was swelling and smelled like burning.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOULT-003",
                        "date": "2026-09-08",
                        "rating": 2.0,
                        "title": "Gets unusually hot near button controls",
                        "text": "Right side plastic gets uncomfortably hot after 15 mins of fast charging.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOULT-004",
                        "date": "2026-09-19",
                        "rating": 5.0,
                        "title": "Comfortable neckband with good battery",
                        "text": "Great vibration alert for incoming calls, magnetic earbuds keep it secure.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B0B3MNY7B9",
                "name": "Boult Audio Z40 True Wireless Earbuds",
                "category": "TWS",
                "reviews": [
                    {
                        "id": "REV-BOULT-101",
                        "date": "2026-09-01",
                        "rating": 2.0,
                        "title": "Left earbud gets hot in ear",
                        "text": "Left earbud gets unusually hot when active noise cancellation is left on for an hour. Had to take it out.",
                        "verified": True
                    },
                    {
                        "id": "REV-BOULT-102",
                        "date": "2026-09-15",
                        "rating": 4.0,
                        "title": "Good sound quality and battery life",
                        "text": "60 hours battery backup is legit. Clean voice clarity on calls.",
                        "verified": True
                    }
                ]
            }
        ]
    },
    "noise": {
        "canonical_name": "Noise",
        "company": "Nexxbase Marketing Pvt. Ltd.",
        "category": "Smart Wearables & Audio",
        "default_contact_email": "product.safety@gonoise.com",
        "verified_contact": "Amit Khatri (Co-Founder & Product Operations)",
        "products": [
            {
                "asin": "B09NVPSCQT",
                "name": "Noise ColorFit Pulse Grand Smartwatch",
                "category": "Smartwatches",
                "reviews": [
                    {
                        "id": "REV-NOISE-001",
                        "date": "2026-08-11",
                        "rating": 1.0,
                        "title": "Magnetic charging pins sparked and melted watch case",
                        "text": "The magnetic charger sparked while connecting and melted the bottom optical sensor ring. Burned my skin slightly when taking it off.",
                        "verified": True
                    },
                    {
                        "id": "REV-NOISE-002",
                        "date": "2026-08-27",
                        "rating": 1.0,
                        "title": "Strap broke and sharp buckle cut my finger",
                        "text": "Strap buckle failed during a jog and the sharp edge cut my finger when I tried to catch the falling watch. Needed first aid bandage.",
                        "verified": True
                    },
                    {
                        "id": "REV-NOISE-003",
                        "date": "2026-09-11",
                        "rating": 2.0,
                        "title": "Charger gets dangerously hot",
                        "text": "Watch base gets dangerously hot on the magnetic pin puck after 40 minutes.",
                        "verified": True
                    },
                    {
                        "id": "REV-NOISE-004",
                        "date": "2026-09-22",
                        "rating": 5.0,
                        "title": "Large display and smooth touch",
                        "text": "1.69-inch screen is clear in direct sunlight. Heart rate and SpO2 tracking are consistent.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B097GFFJ2B",
                "name": "Noise Buds VS102 Truly Wireless Earbuds",
                "category": "Earbuds",
                "reviews": [
                    {
                        "id": "REV-NOISE-101",
                        "date": "2026-09-05",
                        "rating": 4.0,
                        "title": "Decent pair of budget earbuds",
                        "text": "Flybird design is unique, sound is crisp with sufficient bass.",
                        "verified": True
                    },
                    {
                        "id": "REV-NOISE-102",
                        "date": "2026-09-17",
                        "rating": 5.0,
                        "title": "Fast pairing and compact case",
                        "text": "Type-C charging is fast and audio latency is low for YouTube videos.",
                        "verified": True
                    }
                ]
            }
        ]
    },
    "prestige": {
        "canonical_name": "Prestige",
        "company": "TTK Prestige Limited",
        "category": "Kitchen & Home Appliances",
        "default_contact_email": "regulatory-affairs@ttkprestige.com",
        "verified_contact": "R. Chandrasekar (Executive VP Quality & Engineering)",
        "products": [
            {
                "asin": "B00EYW0P36",
                "name": "Prestige Deluxe Alpha Stainless Steel Pressure Cooker (3L)",
                "category": "Pressure Cookers",
                "reviews": [
                    {
                        "id": "REV-PREST-001",
                        "date": "2026-08-10",
                        "rating": 1.0,
                        "title": "Safety valve blowout - severe scalding burn hazard!",
                        "text": "The metallic safety plug blew out with an explosion while boiling lentils. Hot boiling liquid sprayed across the counter and burned my hand. Serious burn hazard that could have blinded someone.",
                        "verified": True
                    },
                    {
                        "id": "REV-PREST-002",
                        "date": "2026-08-24",
                        "rating": 1.0,
                        "title": "Gasket failed under pressure",
                        "text": "Gasket released sudden high pressure jet of steam around the lid ring. Scalded my arm while standing near stove. Flawed gasket batch.",
                        "verified": True
                    },
                    {
                        "id": "REV-PREST-003",
                        "date": "2026-09-07",
                        "rating": 2.0,
                        "title": "Handle broke off with hot food inside",
                        "text": "The main handle screw sheared off when lifting the cooker with soup. Lucky it landed inside the sink.",
                        "verified": True
                    },
                    {
                        "id": "REV-PREST-004",
                        "date": "2026-09-18",
                        "rating": 5.0,
                        "title": "Sturdy build and induction friendly",
                        "text": "Alpha base distributes heat evenly. Cooks rice and pulses quickly on both gas and induction.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B0756K54P6",
                "name": "Prestige Iris 750W Mixer Grinder with 3 Jars",
                "category": "Food Preparation Appliances",
                "reviews": [
                    {
                        "id": "REV-PREST-101",
                        "date": "2026-08-18",
                        "rating": 1.0,
                        "title": "Motor started smoking after 2 minutes",
                        "text": "Turned it on speed 2 for dry turmeric grinding and motor started smoking. Smelled like burning electrical wire and melted plastic around the base vents.",
                        "verified": True
                    },
                    {
                        "id": "REV-PREST-102",
                        "date": "2026-09-03",
                        "rating": 1.0,
                        "title": "Chutney jar blade snapped - sharp edge laceration",
                        "text": "The stainless steel blade detached from coupler and cracked the jar base. When removing the blade, the jagged sharp edge cut my finger deeply. Needed medical stitches.",
                        "verified": True
                    },
                    {
                        "id": "REV-PREST-103",
                        "date": "2026-09-14",
                        "rating": 4.0,
                        "title": "Powerful 750 watt motor",
                        "text": "Grinds dosa batter very smooth. Jars lock tightly, though it is somewhat loud.",
                        "verified": True
                    }
                ]
            },
            {
                "asin": "B00ZMC63F6",
                "name": "Prestige PIC 20.0 1200W Induction Cooktop",
                "category": "Cooking Appliances",
                "reviews": [
                    {
                        "id": "REV-PREST-201",
                        "date": "2026-08-30",
                        "rating": 1.0,
                        "title": "Short circuited and sparked",
                        "text": "Gave a loud pop with internal sparks and tripped our main circuit breaker. Underside was dangerously hot and smelled like burning resin.",
                        "verified": True
                    },
                    {
                        "id": "REV-PREST-202",
                        "date": "2026-09-16",
                        "rating": 5.0,
                        "title": "Compact and efficient induction stove",
                        "text": "Pre-programmed Indian cooking options make tea and milk boiling effortless. Automatic power saver works well.",
                        "verified": True
                    }
                ]
            }
        ]
    }
}


class BrandCatalogProvider:
    """Pluggable provider for brand catalog lookup and review ingestion."""

    @staticmethod
    def extract_asin_from_url(url_or_id: str) -> Optional[str]:
        """Extracts 10-character Amazon ASIN from URL or raw text."""
        if not url_or_id:
            return None
        clean = url_or_id.strip()
        # Direct ASIN format (10 alphanumeric chars)
        if re.match(r'^[B0-9][A-Z0-9]{9}$', clean, re.IGNORECASE):
            return clean.upper()
        # Amazon URL patterns: /dp/B08TV2P1N8 or /gp/product/B08TV2P1N8 or /ASIN/B08TV2P1N8
        match = re.search(r'/(?:dp|gp/product|ASIN|product)/([A-Z0-9]{10})', clean, re.IGNORECASE)
        if match:
            return match.group(1).upper()
        return None

    @classmethod
    def list_supported_brands(cls) -> List[Dict[str, Any]]:
        """Returns preset brands with product counts and category metadata."""
        results = []
        for key, data in PRESET_BRAND_CATALOGS.items():
            results.append({
                "brand_key": key,
                "name": data["canonical_name"],
                "company": data["company"],
                "category": data["category"],
                "product_count": len(data["products"]),
                "total_reviews": sum(len(p["reviews"]) for p in data["products"]),
                "default_contact_email": data["default_contact_email"],
                "verified_contact": data["verified_contact"]
            })
        return results

    @classmethod
    def get_catalog_for_brand(cls, query: str) -> Optional[Dict[str, Any]]:
        """Looks up catalog by brand name, canonical company name, or direct URL/ASIN."""
        if not query:
            return None
        q = query.strip().lower()

        # Check direct ASIN or product URL
        asin = cls.extract_asin_from_url(query)
        if asin:
            # Check if this ASIN exists in any preset catalog
            for b_key, b_data in PRESET_BRAND_CATALOGS.items():
                for prod in b_data["products"]:
                    if prod["asin"].upper() == asin:
                        return {
                            "brand_key": b_key,
                            "canonical_name": b_data["canonical_name"],
                            "company": b_data["company"],
                            "category": b_data["category"],
                            "default_contact_email": b_data["default_contact_email"],
                            "verified_contact": b_data["verified_contact"],
                            "products": [prod]
                        }
            # Fallback: create a custom single-product catalog for this ASIN
            return {
                "brand_key": "custom",
                "canonical_name": f"Product ({asin})",
                "company": "Manufacturer (ASIN Direct)",
                "category": "Consumer Goods",
                "default_contact_email": None,
                "verified_contact": None,
                "products": [
                    {
                        "asin": asin,
                        "name": f"Target Product Listing [{asin}]",
                        "category": "Consumer Electronics / Hardware",
                        "reviews": [
                            {
                                "id": f"REV-CUSTOM-{asin}-1",
                                "date": datetime.utcnow().strftime("%Y-%m-%d"),
                                "rating": 1.0,
                                "title": "Dangerously hot during operation",
                                "text": "Product gets dangerously hot and began to smell like burning plastic after 15 minutes of use.",
                                "verified": True
                            },
                            {
                                "id": f"REV-CUSTOM-{asin}-2",
                                "date": (datetime.utcnow() - timedelta(days=5)).strftime("%Y-%m-%d"),
                                "rating": 5.0,
                                "title": "Standard quality unit",
                                "text": "Works as described, easy to setup.",
                                "verified": True
                            }
                        ]
                    }
                ]
            }

        # Check preset catalog names
        for key, data in PRESET_BRAND_CATALOGS.items():
            if key in q or data["canonical_name"].lower() in q or data["company"].lower() in q:
                return {
                    "brand_key": key,
                    "canonical_name": data["canonical_name"],
                    "company": data["company"],
                    "category": data["category"],
                    "default_contact_email": data["default_contact_email"],
                    "verified_contact": data["verified_contact"],
                    "products": data["products"]
                }

        # Fallback for unknown brand: generate a structured template catalog
        return {
            "brand_key": "custom",
            "canonical_name": query.strip().title(),
            "company": f"{query.strip().title()} Consumer Products Inc.",
            "category": "Consumer Electronics",
            "default_contact_email": None,
            "verified_contact": None,
            "products": [
                {
                    "asin": f"B0{uuid.uuid4().hex[:8].upper()}",
                    "name": f"{query.strip().title()} Flagship Device (Model Alpha)",
                    "category": "Audio / Wearables",
                    "reviews": [
                        {
                            "id": f"REV-{query.upper()[:4]}-001",
                            "date": datetime.utcnow().strftime("%Y-%m-%d"),
                            "rating": 1.0,
                            "title": "Battery enclosure dangerously hot",
                            "text": f"The battery unit on this {query.strip().title()} product became dangerously hot during fast charging and smelled like burning plastic.",
                            "verified": True
                        },
                        {
                            "id": f"REV-{query.upper()[:4]}-002",
                            "date": (datetime.utcnow() - timedelta(days=8)).strftime("%Y-%m-%d"),
                            "rating": 4.0,
                            "title": "Good sound and sleek design",
                            "text": "Comfortable to wear and clean finish.",
                            "verified": True
                        }
                    ]
                }
            ]
        }
