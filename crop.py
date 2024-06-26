from PIL import Image


for i in range(1, 181):
    img = Image.open(f'./images/technique-{i}.png')
    img = img.crop((100, 170, 4150, 1140))
    img.save(f'./processed/technique-{i}.png')
    print(f'./processed/technique-{i}.png')