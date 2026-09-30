from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware

import cv2
import numpy as np

from services.color_analysis import analyze_color
from services.profiles import get_profile


app = FastAPI(
    title="NarcoLens Analysis API",
    description="Computer vision backend for NarcoLens",
    version="1.1.0",
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://narcolens.vercel.app",
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
        "version": "1.1.0",
    }


# ---------------------------------------------------------
# Health
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
    file: UploadFile = File(...),
    profile_id: str = Form(...),
    profile_version: str = Form(...),
    reagent: str = Form(...),
):
    """
    Analyze a captured field-test image.

    The selected test profile is supplied by the
    frontend and is used by the analysis layer.

    NOTE:
    Current result logic remains prototype/demo logic.
    Validated forensic profiles must be supplied by
    authorized laboratory/manufacturer data before
    real-world deployment.
    """

    # -----------------------------------------------------
    # Validate profile metadata
    # -----------------------------------------------------

    if not profile_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Profile ID is required.",
        )

    if not profile_version.strip():
        raise HTTPException(
            status_code=400,
            detail="Profile version is required.",
        )

    if not reagent.strip():
        raise HTTPException(
            status_code=400,
            detail="Reagent information is required.",
        )
    profile = get_profile(
    profile_id,
    profile_version,
)

    if profile is None:
     raise HTTPException(
        status_code=400,
        detail=(
            f"Unknown test profile: "
            f"{profile_id} v{profile_version}"
        ),
    )

    # -----------------------------------------------------
    # Read image
    # -----------------------------------------------------

    image_bytes = await file.read()

    if not image_bytes:
        raise HTTPException(
            status_code=400,
            detail="Empty image received.",
        )

    # -----------------------------------------------------
    # Decode image
    # -----------------------------------------------------

    image_array = np.frombuffer(
        image_bytes,
        dtype=np.uint8,
    )

    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Unable to decode image.",
        )

    # -----------------------------------------------------
    # Run analysis
    # -----------------------------------------------------

    try:
        analysis = analyze_color(
            image=image,
            profile_id=profile_id,
            profile_version=profile_version,
        )

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Image analysis failed: {error}",
        )

    # -----------------------------------------------------
    # Image information
    # -----------------------------------------------------

    height, width = image.shape[:2]

    # -----------------------------------------------------
    # Response
    # -----------------------------------------------------

    return {
        "status": "success",

        "image": {
            "width": width,
            "height": height,
        },

        "profile": {
            "id": profile_id,
            "version": profile_version,
            "reagent": reagent,
        },

        "analysis": analysis,
    }