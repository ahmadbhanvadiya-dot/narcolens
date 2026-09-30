from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware

import cv2
import numpy as np

from services.color_analysis import analyze_color


# ---------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------

app = FastAPI(
    title="NarcoLens Analysis API",
    description="Computer vision backend for NarcoLens",
    version="1.0.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------
# Root
# ---------------------------------------------------------

@app.get("/")
def root():
    return {
        "name": "NarcoLens Analysis API",
        "status": "running",
    }


# ---------------------------------------------------------
# Health Check
# ---------------------------------------------------------

@app.get("/health")
def health():
    return {
        "status": "healthy"
    }


# ---------------------------------------------------------
# Image Analysis
# ---------------------------------------------------------

@app.post("/analyze")
async def analyze_image(
    file: UploadFile = File(...)
):
    # Read uploaded image
    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Empty image received."
        )

    # Convert image bytes to NumPy array
    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8
    )

    # Decode image using OpenCV
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode image."
        )

    # Run color/image analysis
    try:
        analysis = analyze_color(image)

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {error}"
        )

    # Get image dimensions
    height, width = image.shape[:2]

    # Return analysis response
    return {
        "status": "success",

        "image": {
            "width": width,
            "height": height,
        },

        "analysis": analysis,
    }