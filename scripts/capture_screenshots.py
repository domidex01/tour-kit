from playwright.sync_api import sync_playwright
import os

SCREENSHOTS_DIR = "/home/domidex/projects/tour-kit/screenshots"
os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

PAGES = [
    ("home", "https://usertourkit.com/"),
    ("pricing", "https://usertourkit.com/pricing"),
    ("docs", "https://usertourkit.com/docs"),
    ("blog", "https://usertourkit.com/blog"),
    ("compare", "https://usertourkit.com/compare/tour-kit-vs-shepherd-js"),
]

VIEWPORTS = [
    ("desktop", 1440, 900),
    ("mobile", 390, 844),
]

def capture(url, output_path, viewport_width, viewport_height):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": viewport_width, "height": viewport_height})
        try:
            page.goto(url, wait_until="networkidle", timeout=30000)
        except Exception:
            page.goto(url, timeout=30000)
        page.wait_for_timeout(2000)
        page.screenshot(path=output_path, full_page=False)
        browser.close()
        print(f"Saved: {output_path}")

for slug, url in PAGES:
    for device, w, h in VIEWPORTS:
        out = f"{SCREENSHOTS_DIR}/{slug}_{device}.png"
        print(f"Capturing {url} @ {w}x{h} -> {out}")
        try:
            capture(url, out, w, h)
        except Exception as e:
            print(f"ERROR capturing {url}: {e}")

print("Done.")
