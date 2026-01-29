"""
Test script v3 - Matching actual Cash City style more closely
Key adjustments: more angular/low-poly, NO eyebrows, NO mouth, taller proportions
"""

import fal_client
import os
import requests
from pathlib import Path

os.environ["FAL_KEY"] = "bfea91bb-6cc5-43b9-85a7-78c68e44d8a0:7832fc8cf75bac82b2c5d3d5ba451b12"

OUTPUT_DIR = Path(__file__).parent.parent / "training images" / "generated"
OUTPUT_DIR.mkdir(exist_ok=True)

# Refined Cash City style - more angular, no facial features except eyes
STYLE_PROMPT = """3D rendered character, low-poly stylized clay figure,
angular geometric shapes, faceted low-polygon aesthetic,
plain black oval eyes with no detail, NO eyebrows, NO mouth, tiny bump nose,
matte clay material texture, angular blocky hair,
adult body proportions not chibi, slightly elongated limbs,
simple geometric forms, flat shading, muted colors,
solid muted background, front facing portrait,
wearing business suit with tie,
style of low-poly mobile game character, angular toy figure aesthetic"""

NEGATIVE_PROMPT = """eyebrows, mouth, lips, teeth, smile, detailed eyes, pupils, iris,
cute, chibi, short stubby proportions, rounded smooth shapes,
realistic, photorealistic, anime, cartoon, 2D, sketch,
high detail, wrinkles, skin texture"""


def generate_character(prompt_addition="", model="fal-ai/flux/dev"):
    """Generate a character with Flux Dev for better quality"""

    full_prompt = f"{STYLE_PROMPT}, {prompt_addition}" if prompt_addition else STYLE_PROMPT

    print(f"Generating with {model}...")
    print(f"Prompt: {full_prompt[:100]}...")

    result = fal_client.subscribe(
        model,
        arguments={
            "prompt": full_prompt,
            "image_size": "square",
            "num_images": 1,
            "enable_safety_checker": False,
            "num_inference_steps": 28,  # Higher for better quality
            "guidance_scale": 3.5,
        },
    )

    if result and "images" in result and len(result["images"]) > 0:
        image_url = result["images"][0]["url"]
        print(f"Image URL: {image_url}")

        response = requests.get(image_url)
        if response.status_code == 200:
            output_path = OUTPUT_DIR / f"test_v3_{len(list(OUTPUT_DIR.glob('test_v3_*.png'))) + 1}.png"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"Saved to: {output_path}")
            return output_path

    return None


if __name__ == "__main__":
    print("=" * 50)
    print("Cash City Character Gen v3 - Angular Low-Poly Style")
    print("=" * 50)

    # Test with variations
    print("\n[Test 1] Male character - angular style...")
    generate_character("male character, brown angular hair, navy blue suit")

    print("\n[Test 2] Female character - angular style...")
    generate_character("female character, blonde angular hair in ponytail, grey blazer")

    print("\n[Test 3] Male character with red tie...")
    generate_character("male character, dark angular hair, navy suit red tie, white shirt")

    print("\n" + "=" * 50)
    print("Done! Check results in training images/generated/")
    print("=" * 50)
