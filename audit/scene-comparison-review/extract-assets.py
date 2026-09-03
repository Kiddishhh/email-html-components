from pathlib import Path
import hashlib, json
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = Path('/Users/ww/Downloads/评论/VIII.jpg')
image = Image.open(source).convert('RGB')
assert image.size == (1200, 1354)
assets = root / '评论组件/场景对比评论卡/assets'
assets.mkdir(parents=True, exist_ok=True)
boxes = {'before': (0, 0, 600, 676), 'after': (600, 676, 1200, 1354), 'avatar': (648, 74, 756, 182), 'stars': (782, 136, 992, 176)}
for name, box in boxes.items():
    image.crop(box).save(assets / (name + '.png'))
report = {'source': str(source), 'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'sourceSize': list(image.size), 'crops': boxes, 'method': 'Exact source pixel extraction; no generated or substituted imagery', 'surface': '#F5F2ED', 'text': '#1F1F1F', 'canvas': [600, 677]}
Path(__file__).with_name('asset-measurements.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
