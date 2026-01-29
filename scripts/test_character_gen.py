"""
Test script for Cash City character generation using fal.ai
"""

import fal_client
import os
import requests
from pathlib import Path

# Set API key
os.environ["FAL_KEY"] = "bfea91bb-6cc5-43b9-85a7-78c68e44d8a0:7832fc8cf75bac82b2c5d3d5ba451b12"

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "training images" / "generated"
OUTPUT_DIR.mkdir(exist_ok=True)

# Cash City style prompt - describing the 3D clay aesthetic
STYLE_PROMPT = """3D rendered character portrait, stylized clay-like aesthetic, soft rounded forms,
minimal facial features with dot eyes and simple nose, smooth plastic/clay material look,
soft diffused lighting, Pixar-style rendering, cute chibi proportions,
wearing a business suit with tie, professional CEO look,
solid color background, high quality 3D render, octane render style"""

# Negative prompt to avoid unwanted styles
NEGATIVE_PROMPT = """realistic, photorealistic, photograph, 2D, flat, anime, cartoon,
sketch, drawing, painting, watercolor, low quality, blurry, distorted face,
scary, horror, dark, gritty"""


def generate_character(prompt_addition="", seed=None):
    """Generate a character using Flux on fal.ai"""

    full_prompt = f"{STYLE_PROMPT}, {prompt_addition}" if prompt_addition else STYLE_PROMPT

    print(f"Generating character...")
    print(f"Prompt: {full_prompt[:100]}...")

    # Using Flux Schnell for fast testing (can switch to flux-pro for better quality)
    result = fal_client.subscribe(
        "fal-ai/flux/schnell",
        arguments={
            "prompt": full_prompt,
            "image_size": "square",  # 1024x1024
            "num_images": 1,
            "enable_safety_checker": False,
        },
    )

    # Download the image
    if result and "images" in result and len(result["images"]) > 0:
        image_url = result["images"][0]["url"]
        print(f"Image URL: {image_url}")

        # Download and save
        response = requests.get(image_url)
        if response.status_code == 200:
            output_path = OUTPUT_DIR / f"test_character_{len(list(OUTPUT_DIR.glob('*.png'))) + 1}.png"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"Saved to: {output_path}")
            return output_path

    return None


def generate_character_with_face_ref(face_image_path, prompt_addition=""):
    """Generate a character based on a reference face image"""

    # For face-based generation, we'd use IP-Adapter or similar
    # fal.ai has several options for this

    full_prompt = f"{STYLE_PROMPT}, {prompt_addition}" if prompt_addition else STYLE_PROMPT

    print(f"Generating character with face reference...")

    # Using Flux with IP-Adapter for face reference
    # This maintains the identity while applying the style
    result = fal_client.subscribe(
        "fal-ai/flux/dev/image-to-image",
        arguments={
            "prompt": full_prompt,
            "image_url": face_image_path,  # URL or base64
            "strength": 0.75,  # How much to change from original
            "image_size": "square",
            "num_images": 1,
        },
    )

    if result and "images" in result and len(result["images"]) > 0:
        image_url = result["images"][0]["url"]
        print(f"Image URL: {image_url}")

        response = requests.get(image_url)
        if response.status_code == 200:
            output_path = OUTPUT_DIR / f"test_face_ref_{len(list(OUTPUT_DIR.glob('*.png'))) + 1}.png"
            with open(output_path, "wb") as f:
                f.write(response.content)
            print(f"Saved to: {output_path}")
            return output_path

    return None


if __name__ == "__main__":
    print("=" * 50)
    print("Cash City Character Generation Test")
    print("=" * 50)

    # Test 1: Generate a basic character
    print("\n[Test 1] Generating basic Cash City style character...")
    result1 = generate_character("male character, brown hair, friendly smile, front facing portrait")

    # Test 2: Generate with different characteristics
    print("\n[Test 2] Generating female character variant...")
    result2 = generate_character("female character, blonde hair, confident expression, front facing portrait")

    # Test 3: Generate with specific suit color
    print("\n[Test 3] Generating character with blue suit...")
    result3 = generate_character("male character, dark hair, wearing navy blue suit with red tie, front facing portrait")

    print("\n" + "=" * 50)
    print("Generation complete! Check the 'generated' folder.")
    print("=" * 50)
