"""
Analyze a profile picture and generate a Cash City character prompt
Uses Claude's vision to extract colors, vibe, and features
"""

import anthropic
import base64
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file
load_dotenv(Path(__file__).parent.parent / ".env")


def encode_image(image_path: str) -> tuple[str, str]:
    """Encode image to base64 and determine media type"""
    path = Path(image_path)
    suffix = path.suffix.lower()

    media_types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }

    media_type = media_types.get(suffix, 'image/jpeg')

    with open(path, 'rb') as f:
        image_data = base64.standard_b64encode(f.read()).decode('utf-8')

    return image_data, media_type


def analyze_pfp(image_path: str) -> dict:
    """Analyze a profile picture and extract character attributes"""

    client = anthropic.Anthropic()

    image_data, media_type = encode_image(image_path)

    analysis_prompt = """Analyze this profile picture and extract visual attributes for creating a stylized 3D CEO character.

Look for UNIQUE and ECCENTRIC features that make this image distinctive! Unusual accessories, props, expressions, or quirky details would be fun to include.

Return ONLY a JSON object with these fields (no markdown, no explanation):

{
    "hair_color": "color or null if not visible",
    "hair_style": "style description or null if not visible",
    "dominant_colors": ["list", "of", "main", "colors"],
    "accessories": ["wearable items: caps, hats, beanies, glasses, sunglasses, earrings, headphones, chains, jewelry, etc"],
    "quirky_feature": "ONE unique/fun detail that stands out - like: blowing pink bubblegum, cigar in mouth, gold grillz, laser eyes, bandana, face tattoo, tears, tongue out, etc. null if nothing distinctive",
    "skin_tone": "if visible: white, tan, brown, or black. null if not clear or non-human",
    "vibe": "one or two words describing the mood/personality",
    "suit_color": "suggested suit color based on the palette",
    "tie_color": "suggested tie/accent color based on the palette"
}

Be creative! Find something unique that makes this character memorable. Use simple color names."""

    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=500,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": image_data
                        }
                    },
                    {
                        "type": "text",
                        "text": analysis_prompt
                    }
                ]
            }
        ]
    )

    import json
    result = json.loads(response.content[0].text)
    return result


def generate_prompt(analysis: dict) -> str:
    """Generate a character prompt from the analysis"""

    parts = []

    # Skin tone (only realistic tones)
    valid_skin_tones = ['tan', 'brown', 'black', 'dark']
    if analysis.get('skin_tone') and analysis['skin_tone'].lower() in valid_skin_tones:
        parts.append(f"{analysis['skin_tone']} skin")

    # Hair (with default fallback)
    if analysis.get('hair_color') and analysis['hair_color'].lower() != 'null':
        hair = analysis['hair_color']
        if analysis.get('hair_style') and analysis['hair_style'].lower() != 'null':
            hair += f" {analysis['hair_style']}"
        parts.append(f"{hair} hair")
    else:
        parts.append("dark brown hair")

    # Suit
    suit_color = analysis.get('suit_color', 'navy')
    parts.append(f"{suit_color} suit")

    # Tie/accent
    tie_color = analysis.get('tie_color', 'red')
    parts.append(f"{tie_color} tie")

    # Accessories (wearable items)
    if analysis.get('accessories'):
        wearable = ['crown', 'glasses', 'sunglasses', 'hat', 'cap', 'beanie', 'earrings', 'necklace', 'watch', 'cape', 'chain', 'headphones', 'bandana', 'hoodie', 'jewelry']
        accessories = [a for a in analysis['accessories'] if a and any(w in a.lower() for w in wearable)]
        if accessories:
            parts.append(', '.join(accessories[:2]))

    # Quirky feature - the fun unique thing!
    if analysis.get('quirky_feature') and analysis['quirky_feature'].lower() != 'null':
        parts.append(analysis['quirky_feature'])

    # Vibe as expression
    if analysis.get('vibe'):
        parts.append(f"{analysis['vibe']} expression")

    # Instructions for quality
    parts.append("accessories worn naturally and realistically")
    parts.append("only modify the character, keep background unchanged")

    return ", ".join(parts)


def analyze_and_generate(image_path: str) -> tuple[dict, str]:
    """Full pipeline: analyze pfp and generate prompt"""

    print(f"Analyzing: {image_path}")
    print("-" * 40)

    analysis = analyze_pfp(image_path)

    print("Analysis:")
    for key, value in analysis.items():
        print(f"  {key}: {value}")

    print("-" * 40)

    prompt = generate_prompt(analysis)

    print(f"Generated prompt:\n{prompt}")

    return analysis, prompt


if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Default to test images
        test_images = [
            Path(__file__).parent.parent / "training images" / "generated" / "studwud pfp.jpg",
            Path(__file__).parent.parent / "training images" / "generated" / "tomooze pfp.jpg",
        ]

        for img in test_images:
            if img.exists():
                print(f"\n{'=' * 50}")
                analyze_and_generate(str(img))
                print(f"{'=' * 50}\n")
    else:
        analyze_and_generate(sys.argv[1])
