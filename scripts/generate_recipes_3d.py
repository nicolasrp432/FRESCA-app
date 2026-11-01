import math
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps

def generate_guacamole():
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    receta_base = Image.open("public/images/3d/receta.png").convert("RGBA")
    aguacate = Image.open("public/images/3d/aguacate.png").convert("RGBA")
    tomate = Image.open("public/images/3d/tomate.png").convert("RGBA")

    # The ceramic bowl is the base
    filling = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    draw = ImageDraw.Draw(filling)
    # Bowl cavity ellipse
    draw.ellipse((140, 180, 372, 330), fill=(120, 168, 55, 240))
    draw.ellipse((155, 195, 357, 315), fill=(138, 188, 62, 255))
    # Creamy swirls
    draw.arc((170, 210, 340, 290), start=30, end=180, fill=(160, 210, 75, 200), width=18)
    draw.arc((190, 220, 320, 280), start=200, end=350, fill=(110, 150, 48, 180), width=14)
    filling = filling.filter(ImageFilter.GaussianBlur(3))

    canvas.alpha_composite(receta_base)
    canvas.alpha_composite(filling)

    # 3D avocado half sitting tilted on the edge
    av_scaled = aguacate.resize((210, 210), Image.Resampling.LANCZOS).rotate(18, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(av_scaled, (150, 140))

    # Diced 3D tomato on top and side
    tom_scaled = tomate.resize((150, 150), Image.Resampling.LANCZOS).rotate(-15, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(tom_scaled, (240, 190))

    # Add cilantro green sprinkles & lime drop highlights
    sprinkles = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sprinkles)
    for x, y, r in [(210, 260, 6), (230, 280, 5), (280, 265, 7), (195, 290, 5), (310, 275, 6)]:
        sdraw.ellipse((x-r, y-r, x+r, y+r), fill=(55, 115, 42, 230))
        sdraw.ellipse((x-r+1, y-r+1, x, y), fill=(180, 240, 120, 180))
    canvas.alpha_composite(sprinkles)
    return canvas

def generate_pan():
    # 3D banana bread loaf
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    banano = Image.open("public/images/3d/banano.png").convert("RGBA")

    # Cutting board / wood platter
    board = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    bdraw = ImageDraw.Draw(board)
    bdraw.ellipse((70, 310, 442, 420), fill=(160, 105, 52, 255))
    bdraw.ellipse((76, 305, 436, 410), fill=(195, 138, 76, 255))
    bdraw.ellipse((85, 300, 427, 402), fill=(215, 158, 92, 255))
    board = board.filter(ImageFilter.GaussianBlur(1))
    canvas.alpha_composite(board)

    # 3D golden loaf
    loaf = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(loaf)
    # Loaf body
    ldraw.rounded_rectangle((130, 200, 380, 340), radius=50, fill=(148, 82, 32, 255))
    ldraw.rounded_rectangle((136, 192, 374, 328), radius=46, fill=(182, 108, 44, 255))
    ldraw.rounded_rectangle((146, 182, 364, 308), radius=42, fill=(212, 136, 60, 255))
    # Crust top crack with golden crumb inside
    ldraw.ellipse((160, 196, 350, 240), fill=(236, 172, 88, 255))
    ldraw.arc((170, 206, 340, 230), start=0, end=180, fill=(110, 58, 20, 255), width=6)
    # Sugar dust / shine
    ldraw.arc((155, 190, 355, 260), start=190, end=350, fill=(255, 235, 190, 180), width=8)
    loaf = loaf.filter(ImageFilter.GaussianBlur(2))
    canvas.alpha_composite(loaf)

    # Banana slices on top and side
    ban_cut = banano.resize((260, 260), Image.Resampling.LANCZOS).rotate(-22, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(ban_cut, (200, 150))

    # Extra banana beside loaf
    ban_front = banano.resize((190, 190), Image.Resampling.LANCZOS).rotate(30, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(ban_front, (60, 240))

    return canvas

def generate_paleta():
    # 3D fruit popsicle / paleta
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    fresa = Image.open("public/images/3d/fresa.png").convert("RGBA")
    papaya = Image.open("public/images/3d/papaya.png").convert("RGBA")

    # Wooden sticks
    sticks = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(sticks)
    sdraw.rounded_rectangle((195, 330, 225, 450), radius=14, fill=(195, 155, 110, 255))
    sdraw.rounded_rectangle((198, 330, 222, 446), radius=12, fill=(225, 188, 142, 255))
    sdraw.rounded_rectangle((295, 310, 325, 430), radius=14, fill=(195, 155, 110, 255))
    sdraw.rounded_rectangle((298, 310, 322, 426), radius=12, fill=(225, 188, 142, 255))
    canvas.alpha_composite(sticks)

    # Popsicle bodies
    pops = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pops)
    # Back popsicle (Strawberry / Papaya gradient)
    pdraw.rounded_rectangle((260, 130, 360, 330), radius=48, fill=(220, 60, 70, 255))
    pdraw.rounded_rectangle((266, 136, 354, 324), radius=44, fill=(245, 90, 80, 255))
    pdraw.rounded_rectangle((274, 210, 346, 316), radius=36, fill=(245, 140, 65, 255))
    pdraw.line([(280, 160), (280, 290)], fill=(255, 255, 255, 140), width=8)

    # Front popsicle (Papaya tropical orange)
    pdraw.rounded_rectangle((160, 150, 260, 350), radius=48, fill=(220, 110, 40, 255))
    pdraw.rounded_rectangle((166, 156, 254, 344), radius=44, fill=(248, 145, 60, 255))
    pdraw.rounded_rectangle((174, 164, 246, 336), radius=40, fill=(255, 175, 75, 255))
    pdraw.line([(180, 180), (180, 310)], fill=(255, 255, 255, 180), width=9)
    pdraw.ellipse((176, 174, 188, 186), fill=(255, 255, 255, 220))
    pops = pops.filter(ImageFilter.GaussianBlur(1))
    canvas.alpha_composite(pops)

    # 3D Strawberry and Papaya garnish at the base
    fresa_small = fresa.resize((150, 150), Image.Resampling.LANCZOS).rotate(15, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(fresa_small, (80, 280))

    pap_small = papaya.resize((170, 170), Image.Resampling.LANCZOS).rotate(-20, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(pap_small, (280, 260))

    return canvas

def generate_mermelada():
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    fresa = Image.open("public/images/3d/fresa.png").convert("RGBA")

    # Shadow base
    shadow = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    sdraw = ImageDraw.Draw(shadow)
    sdraw.ellipse((130, 390, 382, 450), fill=(50, 30, 15, 80))
    shadow = shadow.filter(ImageFilter.GaussianBlur(12))
    canvas.alpha_composite(shadow)

    # Glass Jar body
    jar = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    jdraw = ImageDraw.Draw(jar)
    jdraw.rounded_rectangle((160, 180, 352, 400), radius=36, fill=(235, 242, 245, 180), outline=(200, 220, 225, 255), width=4)
    jdraw.rounded_rectangle((170, 210, 342, 390), radius=28, fill=(168, 28, 42, 255))
    jdraw.rounded_rectangle((176, 216, 336, 384), radius=24, fill=(198, 38, 54, 255))
    jdraw.line([(184, 220), (184, 370)], fill=(255, 255, 255, 160), width=8)
    jdraw.line([(200, 230), (200, 360)], fill=(255, 255, 255, 90), width=4)

    # Jam label
    jdraw.rounded_rectangle((186, 260, 326, 340), radius=12, fill=(250, 245, 235, 245), outline=(215, 195, 170, 255), width=2)
    jdraw.ellipse((240, 285, 272, 320), fill=(215, 45, 55, 255))
    jdraw.polygon([(256, 280), (248, 288), (264, 288)], fill=(75, 140, 50, 255))

    # Jar fabric lid
    jdraw.ellipse((150, 155, 362, 195), fill=(215, 145, 65, 255))
    jdraw.ellipse((156, 150, 356, 188), fill=(245, 180, 85, 255))
    jdraw.rounded_rectangle((170, 184, 342, 196), radius=6, fill=(145, 95, 45, 255))
    jar = jar.filter(ImageFilter.GaussianBlur(1))
    canvas.alpha_composite(jar)

    # 3D Strawberries around base
    f1 = fresa.resize((150, 150), Image.Resampling.LANCZOS).rotate(12, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(f1, (90, 280))

    f2 = fresa.resize((130, 130), Image.Resampling.LANCZOS).rotate(-25, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(f2, (300, 300))

    return canvas

def generate_hogao():
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    tomate = Image.open("public/images/3d/tomate.png").convert("RGBA")

    # Cast iron pan handle
    handle = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(handle)
    hdraw.rounded_rectangle((320, 280, 480, 324), radius=18, fill=(45, 48, 50, 255))
    hdraw.rounded_rectangle((324, 284, 476, 320), radius=16, fill=(70, 74, 78, 255))
    hdraw.ellipse((440, 292, 464, 312), fill=(0, 0, 0, 0))
    canvas.alpha_composite(handle)

    # Cast iron pan body
    pan = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    pdraw = ImageDraw.Draw(pan)
    pdraw.ellipse((70, 160, 370, 400), fill=(42, 45, 48, 255))
    pdraw.ellipse((76, 166, 364, 394), fill=(65, 68, 72, 255))
    pdraw.ellipse((86, 176, 354, 384), fill=(35, 38, 40, 255))

    # Rich red-golden hogao sauce
    pdraw.ellipse((96, 186, 344, 374), fill=(185, 38, 26, 255))
    pdraw.ellipse((108, 196, 332, 364), fill=(215, 55, 32, 255))
    pdraw.ellipse((130, 220, 310, 340), fill=(235, 85, 40, 255))
    for x, y in [(160, 240), (210, 280), (250, 230), (190, 310), (270, 290)]:
        pdraw.arc((x, y, x+40, y+24), start=20, end=160, fill=(255, 230, 140, 220), width=5)
        pdraw.ellipse((x+15, y+8, x+23, y+16), fill=(60, 130, 45, 230))
    pan = pan.filter(ImageFilter.GaussianBlur(1))
    canvas.alpha_composite(pan)

    # Fresh 3D ripe tomato beside skillet
    tom = tomate.resize((170, 170), Image.Resampling.LANCZOS).rotate(15, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(tom, (60, 120))

    return canvas

def generate_avena():
    canvas = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    receta_base = Image.open("public/images/3d/receta.png").convert("RGBA")
    banano = Image.open("public/images/3d/banano.png").convert("RGBA")
    fresa = Image.open("public/images/3d/fresa.png").convert("RGBA")

    canvas.alpha_composite(receta_base)

    # Oatmeal porridge filling inside bowl
    oat = Image.new("RGBA", (512, 512), (0, 0, 0, 0))
    odraw = ImageDraw.Draw(oat)
    odraw.ellipse((140, 180, 372, 330), fill=(218, 196, 160, 240))
    odraw.ellipse((152, 192, 360, 318), fill=(238, 220, 186, 255))
    odraw.ellipse((168, 206, 344, 304), fill=(248, 235, 208, 255))
    odraw.arc((175, 215, 335, 295), start=40, end=200, fill=(160, 95, 45, 160), width=10)
    odraw.arc((200, 230, 310, 280), start=210, end=350, fill=(140, 80, 35, 140), width=6)
    oat = oat.filter(ImageFilter.GaussianBlur(2))
    canvas.alpha_composite(oat)

    # 3D Banana slices arranged in bowl
    ban = banano.resize((190, 190), Image.Resampling.LANCZOS).rotate(-18, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(ban, (140, 160))

    # 3D Strawberry slice on the other side
    fre = fresa.resize((140, 140), Image.Resampling.LANCZOS).rotate(25, resample=Image.Resampling.BICUBIC)
    canvas.alpha_composite(fre, (250, 180))

    return canvas

def main():
    print("Generando 6 ilustraciones 3D distintas para recetas...")
    guac = generate_guacamole()
    guac.save("public/images/3d/receta-guacamole.png", "PNG")
    print("-> receta-guacamole.png")

    pan = generate_pan()
    pan.save("public/images/3d/receta-pan.png", "PNG")
    print("-> receta-pan.png")

    paleta = generate_paleta()
    paleta.save("public/images/3d/receta-paleta.png", "PNG")
    print("-> receta-paleta.png")

    mermelada = generate_mermelada()
    mermelada.save("public/images/3d/receta-mermelada.png", "PNG")
    print("-> receta-mermelada.png")

    hogao = generate_hogao()
    hogao.save("public/images/3d/receta-hogao.png", "PNG")
    print("-> receta-hogao.png")

    avena = generate_avena()
    avena.save("public/images/3d/receta-avena.png", "PNG")
    print("-> receta-avena.png")
    print("Completado exitosamente!")

if __name__ == "__main__":
    main()
