import cv2
import numpy as np


def analyze_color(image: np.ndarray):
    """
    Performs safe demonstration color analysis.

    This does NOT identify a real controlled substance.
    It extracts image/color characteristics and compares
    them against a simulated reference profile.
    """

    if image is None or image.size == 0:
        raise ValueError("Invalid image.")

    # --------------------------------------------------
    # 1. Image quality
    # --------------------------------------------------

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    brightness = float(np.mean(gray))
    contrast = float(np.std(gray))

    # Laplacian variance is a simple sharpness indicator.
    sharpness = float(cv2.Laplacian(gray, cv2.CV_64F).var())

    quality = "Good"

    if brightness < 25 or brightness > 235:
        quality = "Poor"

    if contrast < 15:
        quality = "Poor"

    if sharpness < 20:
        quality = "Limited"

    # --------------------------------------------------
    # 2. Central sample region
    # --------------------------------------------------

    height, width = image.shape[:2]

    sample_width = int(width * 0.30)
    sample_height = int(height * 0.30)

    start_x = int((width - sample_width) / 2)
    start_y = int((height - sample_height) / 2)

    sample = image[
        start_y:start_y + sample_height,
        start_x:start_x + sample_width
    ]

    # --------------------------------------------------
    # 3. Average BGR
    # --------------------------------------------------

    mean_bgr = np.mean(sample, axis=(0, 1))

    b = float(mean_bgr[0])
    g = float(mean_bgr[1])
    r = float(mean_bgr[2])

    rgb = {
        "r": round(r, 2),
        "g": round(g, 2),
        "b": round(b, 2),
    }

    # --------------------------------------------------
    # 4. HSV
    # --------------------------------------------------

    hsv_sample = cv2.cvtColor(
        sample,
        cv2.COLOR_BGR2HSV
    )

    mean_hsv = np.mean(
        hsv_sample,
        axis=(0, 1)
    )

    hsv = {
        "h": round(float(mean_hsv[0]) * 2, 2),
        "s": round(float(mean_hsv[1]) / 255 * 100, 2),
        "v": round(float(mean_hsv[2]) / 255 * 100, 2),
    }

    # --------------------------------------------------
    # 5. CIELAB
    # --------------------------------------------------

    lab_sample = cv2.cvtColor(
        sample,
        cv2.COLOR_BGR2LAB
    )

    mean_lab = np.mean(
        lab_sample,
        axis=(0, 1)
    )

    # OpenCV stores:
    # L: 0-255
    # A: 0-255
    # B: 0-255
    #
    # Convert to conventional CIELAB ranges.

    lab = {
        "l": round(float(mean_lab[0]) * 100 / 255, 2),
        "a": round(float(mean_lab[1]) - 128, 2),
        "b": round(float(mean_lab[2]) - 128, 2),
    }

    # --------------------------------------------------
    # 6. Simulated reference profile
    # --------------------------------------------------

    # This is ONLY a demo profile.
    # It does not represent a real drug or test kit.

    reference_lab = {
        "l": 55.0,
        "a": 10.0,
        "b": 15.0,
    }

    # --------------------------------------------------
    # 7. CIE76 Delta E
    # --------------------------------------------------

    delta_l = lab["l"] - reference_lab["l"]
    delta_a = lab["a"] - reference_lab["a"]
    delta_b = lab["b"] - reference_lab["b"]

    delta_e = float(
        np.sqrt(
            delta_l ** 2 +
            delta_a ** 2 +
            delta_b ** 2
        )
    )

    # --------------------------------------------------
    # 8. Demo confidence
    # --------------------------------------------------

    confidence = max(
        0.0,
        min(
            0.98,
            1.0 - (delta_e / 100.0)
        )
    )

    # Poor image quality should reduce confidence.

    if quality == "Poor":
        confidence *= 0.5

    elif quality == "Limited":
        confidence *= 0.7

    confidence = round(confidence, 3)

    # --------------------------------------------------
    # 9. Demo classification
    # --------------------------------------------------

    # Deliberately conservative:
    # ambiguous evidence remains Inconclusive.

    if quality == "Poor":
        result = "Inconclusive"

    elif delta_e < 5:
        result = "Demo Match"

    else:
        result = "Inconclusive"

    return {
        "result": result,
        "confidence": confidence,
        "quality": quality,
        "brightness": round(brightness, 2),
        "contrast": round(contrast, 2),
        "sharpness": round(sharpness, 2),
        "rgb": rgb,
        "hsv": hsv,
        "lab": lab,
        "reference_lab": reference_lab,
        "delta_e": round(delta_e, 2),
    }