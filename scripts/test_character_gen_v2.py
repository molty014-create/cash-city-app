"""
Test script v2 - More specific Cash City style
"""

import fal_client
import os
import requests
from pathlib import Path

os.environ["FAL_KEY"] = "bfea91bb-6cc5-43b9-85a7-78c68e44d8a0:7832fc8cf75bac82b2c5d3d5ba451b12"

OUTPUT_DIR = Path(__file__).parent.parent / "training images" / "generated"
OUTPUT_DIR.mkdir(exist_ok=True)

# More specific Cash City style - emphasizing the minimal features
STYLE_PROMPT = """3D rendered character, simple clay doll style, extremely minimal facial features,
tiny black dot eyes with no pupils or iris detail, almost no nose just a tiny bump,
no visible mouth or very subtle, smooth matte clay/plasticine material texture,
chunky rounded body proportions, simple geometric shapes,
muted soft lighting, solid pastel color background,
wearing simple business suit, front facing portrait,
style of Gang Beasts game characters, claymation style, vinyl toy aesthetic"""

NEGATIVE_PROMPT = """detailed eyes, realistic eyes, pupils, iris, anime eyes, disney eyes,
prominent nose, realistic nose, detailed mouth, teeth, realistic skin texture,
photorealistic, photograph, 2D, sketch, painting"""


def generate_character(prompt_addition="", model="fal-ai/flux/schnell"):
    """Generate a character"""

    full_prompt = f"{STYLE_PROMPT}, {prompt_addition}" if prompt_addition else STYLE_PROMPT

    print(f"Generating with {model}...")
    print(f"Prompt: {full_prompt[:80]}...")

    result = fal_client.subscribe(
        model,
        arguments={
            "prompt": full_prompt,
            "image_size": "square",
            "num_images": 1,
            "enable_safety_checker": False,
        },
    )

    if result and "images" in result and len(result["images"]) > 0:
        image_url = result["images"][0]["url"]
        print(f"Image URL: {image_url}")

        response = requests.get(image_url)
        if response.status_code == 200:
            output_path = OUTPUT_DIR / f"test_v2_{len(list(OUTPUT_DIR.glob('test_v2_*.png'))) + 1}.png"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"Saved to: {output_path}")
            return output_path

    return None


if __name__ == "__main__":
    print("=" * 50)
    print("Cash City Character Gen v2 - Minimal Style")
    print("=" * 50)

    # Test with Flux Schnell (fast)
    print("\n[Test 1] Male character - minimal style...")
    generate_character("male character, brown hair, blue suit")

    print("\n[Test 2] Female character - minimal style...")
    generate_character("female character, blonde hair in ponytail, grey blazer")

    # Try with Flux Dev (higher quality)
    print("\n[Test 3] Using Flux Dev for higher quality...")
    generate_character("male character, dark hair, navy suit red tie", model="fal-ai/flux/dev")

    print("\n" + "=" * 50)
    print("Done! Check results.")
    print("=" * 50)
