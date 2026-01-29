# Cash City - CEO Photo Booth Scene Spec

## Overview
We need a 3D scene for the prelaunch app where users get their "CEO badge photo" taken. AI will customize the character's face and suit colors based on the user's Twitter profile picture.

## Scene Description
An **off-angle view** of a character sitting for their office ID photo. Think "behind the scenes of a corporate headshot session" in the Cash City world.

---

## Scene Elements

### 1. The Photo Booth Setup
- **White/cream canvas backdrop** (like a real photo studio)
- **Photography lighting** - softbox or umbrella lights visible
- **Camera on tripod** - pointing at the character (visible in frame)
- Optional: lighting stands, cables, sandbags for authenticity

### 2. The Chair
- Small office chair or stool in center
- Character sits facing the camera (their back partially to us)
- Chair should match Cash City aesthetic

### 3. The Character (IMPORTANT)
- **Use a base/placeholder character** sitting on the chair
- **Pose:** Sitting upright, slight smile, "photo pose"
- **Facing:** Toward the backdrop/camera (approximately 30-45° away from our view)
- **We will AI-replace:** Face, hair, skin tone, suit color
- Keep the character's **face clearly visible** from our camera angle

### 4. Environment/Surroundings
- Cash City office environment visible around the booth
- Trading screens, desks, plants in background (blurred/out of focus is fine)
- Feels like a corner of the trading floor set up for photos

---

## Camera & Composition

```
        [Canvas Backdrop]
              |
         [Character] ←── facing this way
            /
           /
       [Our Camera - off to the side]
```

- **Camera angle:** 30-45° to the side of the photo setup
- **Show:** The character, the backdrop, the photography equipment
- **Depth of field:** Character sharp, background slightly soft
- **Framing:** Character takes up ~40-50% of frame height

---

## Technical Requirements

| Spec | Value |
|------|-------|
| **Output Resolution** | 1080 x 1080 px (square) |
| **Format** | PNG (transparent BG not needed) |
| **Lighting** | Match existing Cash City renders |
| **Style** | Same soft 3D / clay-like look as other assets |

---

## Deliverables

1. **Final render** - The complete scene as described above
2. **Character mask layer** (optional but helpful) - Separate render pass with just the character silhouette, for easier AI compositing

---

## Reference
- See existing Cash City renders in this folder for style reference
- Character style should match `image.png` and `Still_01.png`
- Environment vibe like `office1.png`

---

## Notes for AI Integration
- The character's **face area** will be replaced/inpainted by AI
- **Suit color** will be adjusted based on user preferences
- Keep face well-lit and clearly visible from our angle
- Avoid complex face angles - 3/4 view works best

---

## Questions?
Ping Will or respond in thread.
