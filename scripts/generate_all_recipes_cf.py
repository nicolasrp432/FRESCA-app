import urllib.request
import urllib.parse
import os
import ssl
from PIL import Image
import numpy as np

ssl._create_default_https_context = ssl._create_unverified_context

RECIPES = {
    "receta-guacamole": "3d clay render, cute ceramic bowl filled with green guacamole, sliced ripe avocado, diced red tomatoes, cilantro leaves, isolated plain white background, warm cheerful studio lighting",
    "receta-pan": "3d clay render, golden baked banana bread loaf sliced on wooden cutting board, banana slices, isolated plain white background, warm cozy lighting",
    "receta-paleta": "3d clay render, two delicious fruit popsicles with wooden sticks, strawberry and papaya, isolated plain white background, vibrant cheerful colors",
    "receta-mermelada": "3d clay render, glass mason jar of glossy red strawberry jam with cloth lid and string, fresh strawberries, isolated plain white background",
    "receta-hogao": "3d clay render, small cast iron pan with cooked tomato and onion sofrito hogao sauce, wooden spoon, isolated plain white background",
    "receta-avena": "3d clay render, cute ceramic bowl of warm oatmeal porridge topped with sliced bananas and fresh red strawberries, isolated plain white background"
}

OUT_DIR = "public/images/3d"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_background(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    
    # Sample corner pixels to find background color
    corners = [
        arr[5, 5, :3],
        arr[5, -5, :3],
        arr[-5, 5, :3],
        arr[-5, -5, :3],
    ]
    bg_color = np.mean(corners, axis=0)
    
    # Calculate color distance to background
    dist = np.sqrt((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)
    
    # Soft alpha feathering
    # Close to bg -> transparent
    new_a = np.clip((dist - 20.0) / 40.0, 0.0, 1.0) * 255.0
    arr[:, :, 3] = np.minimum(a, new_a)
    
    out = Image.fromarray(arr.astype(np.uint8), "RGBA")
    return out.resize((512, 512), Image.Resampling.LANCZOS)

def main():
    base_url = "https://fresca-app.nicolasrp432.workers.dev/api/ai/gen-image"
    for name, prompt in RECIPES.items():
        print(f"Generating {name}...")
        url = f"{base_url}?prompt={urllib.parse.quote(prompt)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Fresca/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=60) as resp:
                tmp_path = f"/tmp/{name}_cf.jpg"
                with open(tmp_path, "wb") as f:
                    f.write(resp.read())
                
                raw = Image.open(tmp_path)
                processed = remove_background(raw)
                dest = os.path.join(OUT_DIR, f"{name}.png")
                processed.save(dest, "PNG")
                print(f"✓ Saved {dest}")
        except Exception as e:
            print(f"✗ Failed {name}: {e}")

if __name__ == "__main__":
    main()
