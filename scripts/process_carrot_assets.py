import sys
from PIL import Image, ImageFilter
import numpy as np

def remove_white_bg(input_path, output_path, target_size=(512, 512), threshold=242):
    img = Image.open(input_path).convert("RGBA")
    data = np.array(img)
    
    # Calculate whiteness
    r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]
    
    # White background detection with soft transition
    # Distance to pure white (255, 255, 255)
    dist_to_white = np.sqrt((255.0 - r)**2 + (255.0 - g)**2 + (255.0 - b)**2)
    
    # Thresholding: if distance is small (< 15), fully transparent.
    # If distance between 15 and 35, linear alpha fade.
    alpha = np.clip((dist_to_white - 12.0) / 24.0, 0.0, 1.0) * 255.0
    
    # Also handle pure white near borders
    data[:, :, 3] = alpha.astype(np.uint8)
    
    res = Image.fromarray(data, "RGBA")
    
    # Find bounding box of non-transparent pixels to center and maximize
    bbox = res.getbbox()
    if bbox:
        cropped = res.crop(bbox)
        # Resize maintaining aspect ratio to fit within 440x440
        w, h = cropped.size
        scale = min(440.0 / w, 440.0 / h)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
        
        # Center in 512x512 transparent canvas
        canvas = Image.new("RGBA", target_size, (0, 0, 0, 0))
        offset_x = (target_size[0] - new_w) // 2
        offset_y = (target_size[1] - new_h) // 2
        canvas.paste(resized, (offset_x, offset_y), resized)
        canvas.save(output_path, "PNG")
        print(f"Saved {output_path}")
    else:
        res.resize(target_size, Image.Resampling.LANCZOS).save(output_path, "PNG")
        print(f"Saved {output_path} without bbox")

if __name__ == "__main__":
    carrot_in = "/Users/nicolas/.gemini/antigravity-ide/brain/f54147df-112d-4884-860f-926fe8af345d/zanahoria_3d_1794241476732.jpg"
    carrot_out = "public/images/3d/zanahoria.png"
    remove_white_bg(carrot_in, carrot_out)

    soup_in = "/Users/nicolas/.gemini/antigravity-ide/brain/f54147df-112d-4884-860f-926fe8af345d/receta_zanahoria_3d_1794241494064.jpg"
    soup_out = "public/images/3d/receta-crema-zanahoria.png"
    remove_white_bg(soup_in, soup_out)
