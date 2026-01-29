"""
Test script v4 - Extreme minimal face, no eyebrows at all
"""

import fal_client
import os
import requests
from pathlib import Path

os.environ["FAL_KEY"] = "bfea91bb-6cc5-43b9-85a7-78c68e44d8a0:7832fc8cf75bac82b2c5d3d5ba451b12"

OUTPUT_DIR = Path(__file__).parent.parent / "training images" / "generated"
OUTPUT_DIR.mkdir(exist_ok=True)

# Extreme minimal face - like a toy/mannequin
STYLE_PROMPT = """3D rendered low-poly character figure,
blank expressionless face like a mannequin,
only two flat black oval shapes for eyes on smooth featureless face,
completely smooth face with no eyebrows no mouth no expression lines,
angular geometric low-polygon body and hair,
matte clay material, faceted low-poly hair shapes,
adult figure proportions with elongated limbs,
wearing business suit with tie,
solid grey background, front view portrait,
minimalist toy figure aesthetic, vinyl collectible figure style"""

NEGATIVE_PROMPT = """eyebrows, mouth, lips, teeth, smile, frown, expression,
facial features, wrinkles, details, realistic face, anime face,
chibi, cute, cartoon, rounded shapes, photorealistic"""


def generate_character(prompt_addition="", model="fal-ai/flux/dev"):
    """Generate with Flux Dev"""

    full_prompt = f"{STYLE_PROMPT}, {prompt_addition}" if prompt_addition else STYLE_PROMPT

    print(f"Generating...")
    print(f"Prompt: {full_prompt[:80]}...")

    result = fal_client.subscribe(
        model,
        arguments={
            "prompt": full_prompt,
            "image_size": "square",
            "num_images": 1,
            "enable_safety_checker": False,
            "num_inference_steps": 30,
            "guidance_scale": 4.0,  # Higher guidance for more prompt adherence
        },
    )

    if result and "images" in result and len(result["images"]) > 0:
        image_url = result["images"][0]["url"]
        print(f"Image URL: {image_url}")

        response = requests.get(image_url)
        if response.status_code == 200:
            output_path = OUTPUT_DIR / f"test_v4_{len(list(OUTPUT_DIR.glob('test_v4_*.png'))) + 1}.png"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"Saved to: {output_path}")
            return output_path

    return None


if __name__ == "__main__":
    print("=" * 50)
    print("Cash City Character Gen v4 - Mannequin Face Style")
    print("=" * 50)

    print("\n[Test 1] Male - blank mannequin face...")
    generate_character("male figure, brown angular hair, navy suit")

    print("\n[Test 2] Female - blank mannequin face...")
    generate_character("female figure, blonde angular ponytail hair, grey suit")

    print("\n[Test 3] Male - red tie, blank face...")
    generate_character("male figure, black angular hair, navy suit red tie")

    print("\n" + "=" * 50)
    print("Done!")
    print("=" * 50)
