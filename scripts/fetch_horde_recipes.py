import urllib.request
import json
import time
import os
import ssl
from PIL import Image
import numpy as np

# Disable SSL verification for urllib on macOS
ssl._create_default_https_context = ssl._create_unverified_context

JOBS = {
    "receta-guacamole": "a93b6962-9388-4c58-bc8b-1e8ddb155890",
    "receta-pan": "317c5b0d-6166-4a2e-bba1-a21b876c4029",
    "receta-paleta": "cc8af215-f9c0-47ad-8c1c-236ea5c305c5",
    "receta-mermelada": "f602ef7a-f53b-4cb7-b66b-da4d03a9bb1d",
    "receta-hogao": "2decee53-cbaf-4aa9-946d-5d1098975472"
}

OUT_DIR = "public/images/3d"
os.makedirs(OUT_DIR, exist_ok=True)

def remove_white_bg(img: Image.Image) -> Image.Image:
    img = img.convert("RGBA")
    arr = np.array(img, dtype=np.float32)
    r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]
    
    # Distance from white
    dist = np.sqrt((255.0 - r)**2 + (255.0 - g)**2 + (255.0 - b)**2)
    
    # Smooth alpha feathering:
    # dist < 12 -> alpha = 0 (pure background)
    # dist between 12 and 55 -> smoothly fade
    new_a = np.clip((dist - 12.0) / 43.0, 0.0, 1.0) * 255.0
    arr[:, :, 3] = np.minimum(a, new_a)
    
    return Image.fromarray(arr.astype(np.uint8), "RGBA")

def check_and_download():
    pending = dict(JOBS)
    headers = {"User-Agent": "Mozilla/5.0"}
    
    for attempt in range(25):
        if not pending:
            print("All recipes downloaded and processed!")
            break
            
        print(f"Check attempt {attempt+1}, pending: {list(pending.keys())}")
        to_remove = []
        
        for name, jid in pending.items():
            check_url = f"https://aihorde.net/api/v2/generate/check/{jid}"
            req = urllib.request.Request(check_url, headers=headers)
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    data = json.loads(resp.read().decode())
                    if data.get("done"):
                        status_url = f"https://aihorde.net/api/v2/generate/status/{jid}"
                        req_stat = urllib.request.Request(status_url, headers=headers)
                        with urllib.request.urlopen(req_stat, timeout=10) as sresp:
                            sdata = json.loads(sresp.read().decode())
                            gens = sdata.get("generations", [])
                            if gens and gens[0].get("img"):
                                img_url = gens[0]["img"]
                                print(f"Downloading {name} from {img_url[:60]}...")
                                temp_path = f"/tmp/{name}_raw.webp"
                                img_req = urllib.request.Request(img_url, headers=headers)
                                with urllib.request.urlopen(img_req, timeout=30) as ir, open(temp_path, "wb") as f:
                                    f.write(ir.read())
                                
                                # Convert & process
                                raw_img = Image.open(temp_path)
                                proc_img = remove_white_bg(raw_img)
                                out_path = os.path.join(OUT_DIR, f"{name}.png")
                                proc_img.save(out_path, "PNG")
                                print(f"SUCCESS: Saved {out_path} ({proc_img.size})")
                                to_remove.append(name)
            except Exception as e:
                print(f"Error checking {name}: {e}")
                
        for r in to_remove:
            del pending[r]
            
        if pending:
            time.sleep(5)

if __name__ == "__main__":
    check_and_download()
