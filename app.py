from fastapi import FastAPI
from fastapi.responses import Response
from playwright.async_api import async_playwright
import uvicorn

app = FastAPI()

browser = None


@app.on_event("startup")
async def startup():
    global browser

    pw = await async_playwright().start()

    browser = await pw.chromium.launch(
        headless=True,
        args=[
            "--disable-gpu",
            "--no-sandbox",
            "--disable-dev-shm-usage"
        ]
    )


@app.on_event("shutdown")
async def shutdown():
    global browser

    if browser:
        await browser.close()


@app.get("/banner")
async def banner(device: str = "INGRES"):

    page = await browser.new_page(
        viewport={"width": 1600, "height": 900},
        device_scale_factor=2
    )

    await page.goto(
        f"http://127.0.0.1:5500/?device={device}",
        wait_until="networkidle"
    )

    # ждём, пока canvas нарисуется
    await page.wait_for_timeout(500)

    png = await page.screenshot(
        full_page=True,
        type="png"
    )

    await page.close()

    return Response(
        content=png,
        media_type="image/png"
    )


if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False
    )