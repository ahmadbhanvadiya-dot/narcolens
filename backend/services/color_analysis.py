import cv2
import numpy as np


# ---------------------------------------------------------
# Utility functions
# ---------------------------------------------------------

def clamp(value, minimum, maximum):
    return max(minimum, min(value, maximum))


def calculate_delta_e(lab1, lab2):
    """
    CIE76 Delta E.
    """
    return float(
        np.sqrt(
            (lab1[0] - lab2[0]) ** 2
            + (lab1[1] - lab2[1]) ** 2
            + (lab1[2] - lab2[2]) ** 2
        )
    )


def calculate_image_quality(image):
    """
    Basic image-quality measurements.
    """

    gray = cv2.cvtColor(
        image,
        cv2.COLOR_BGR2GRAY
    )

    brightness = float(
        np.mean(gray)
    )

    contrast = float(
        np.std(gray)
    )

    sharpness = float(
        cv2.Laplacian(
            gray,
            cv2.CV_64F
        ).var()
    )

    # Simple prototype thresholds.
    if (
        brightness < 35
        or brightness > 225
        or contrast < 12
        or sharpness < 20
    ):
        quality = "Poor"

    elif (
        brightness < 55
        or brightness > 205
        or contrast < 20
        or sharpness < 60
    ):
        quality = "Fair"

    else:
        quality = "Good"

    return {
        "brightness": round(
            brightness,
            2
        ),
        "contrast": round(
            contrast,
            2
        ),
        "sharpness": round(
            sharpness,
            2
        ),
        "quality": quality,
    }


# ---------------------------------------------------------
# Region extraction
# ---------------------------------------------------------

def get_region(
    image,
    x1_ratio,
    y1_ratio,
    x2_ratio,
    y2_ratio
):
    """
    Extract a region using normalized coordinates.

    Ratios are between 0 and 1.
    """

    height, width = image.shape[:2]

    x1 = int(width * x1_ratio)
    y1 = int(height * y1_ratio)

    x2 = int(width * x2_ratio)
    y2 = int(height * y2_ratio)

    x1 = clamp(x1, 0, width - 1)
    x2 = clamp(x2, 1, width)

    y1 = clamp(y1, 0, height - 1)
    y2 = clamp(y2, 1, height)

    if x2 <= x1 or y2 <= y1:
        raise ValueError(
            "Invalid image region."
        )

    return image[y1:y2, x1:x2]


def remove_extreme_pixels(
    pixels
):
    """
    Remove very dark and very bright pixels.

    This reduces the influence of shadows,
    glare and background pixels.
    """

    if len(pixels) == 0:
        return pixels

    brightness = np.mean(
        pixels,
        axis=1
    )

    low = np.percentile(
        brightness,
        5
    )

    high = np.percentile(
        brightness,
        95
    )

    filtered = pixels[
        (brightness >= low)
        & (brightness <= high)
    ]

    if len(filtered) < 10:
        return pixels

    return filtered


def get_median_color(
    region
):
    """
    Get a robust representative BGR
    colour from a region.
    """

    pixels = region.reshape(
        -1,
        3
    ).astype(np.float32)

    pixels = remove_extreme_pixels(
        pixels
    )

    median = np.median(
        pixels,
        axis=0
    )

    return median


# ---------------------------------------------------------
# Colour conversions
# ---------------------------------------------------------

def bgr_to_rgb(
    bgr
):
    return {
        "r": round(
            float(bgr[2]),
            2
        ),
        "g": round(
            float(bgr[1]),
            2
        ),
        "b": round(
            float(bgr[0]),
            2
        ),
    }


def bgr_to_hsv(
    bgr
):
    pixel = np.uint8(
        [[
            [
                clamp(
                    int(bgr[0]),
                    0,
                    255
                ),
                clamp(
                    int(bgr[1]),
                    0,
                    255
                ),
                clamp(
                    int(bgr[2]),
                    0,
                    255
                ),
            ]
        ]]
    )

    hsv = cv2.cvtColor(
        pixel,
        cv2.COLOR_BGR2HSV
    )[0][0]

    return {
        "h": round(
            float(hsv[0]),
            2
        ),
        "s": round(
            float(hsv[1]),
            2
        ),
        "v": round(
            float(hsv[2]),
            2
        ),
    }


def bgr_to_lab(bgr):
    pixel = np.uint8(
        [[
            [
                clamp(int(bgr[0]), 0, 255),
                clamp(int(bgr[1]), 0, 255),
                clamp(int(bgr[2]), 0, 255),
            ]
        ]]
    )

    lab = cv2.cvtColor(
        pixel,
        cv2.COLOR_BGR2LAB
    )[0][0]

    # OpenCV stores LAB as:
    # L: 0–255
    # a: 0–255 with 128 as neutral
    # b: 0–255 with 128 as neutral
    #
    # Convert to conventional CIE L*a*b*:
    # L*: 0–100
    # a*: approximately -128–127
    # b*: approximately -128–127

    l_star = (
        float(lab[0]) * 100.0 / 255.0
    )

    a_star = (
        float(lab[1]) - 128.0
    )

    b_star = (
        float(lab[2]) - 128.0
    )

    return {
        "l": round(l_star, 2),
        "a": round(a_star, 2),
        "b": round(b_star, 2),
    }

# ---------------------------------------------------------
# Reference-card calibration
# ---------------------------------------------------------

def calibrate_test_color(
    reference_bgr,
    test_bgr
):
    """
    Estimate the colour shift between the
    reference card and the test region.

    This is a prototype relative calibration.

    The reference card is treated as the
    lighting reference captured in the same
    image as the test region.
    """

    reference_rgb = bgr_to_rgb(
        reference_bgr
    )

    test_rgb = bgr_to_rgb(
        test_bgr
    )

    reference_mean = np.array(
        [
            reference_rgb["r"],
            reference_rgb["g"],
            reference_rgb["b"],
        ],
        dtype=np.float32
    )

    test_mean = np.array(
        [
            test_rgb["r"],
            test_rgb["g"],
            test_rgb["b"],
        ],
        dtype=np.float32
    )

    # Difference between reference and test.
    correction = (
        reference_mean
        - test_mean
    )

    calibrated = (
        test_mean
        + correction * 0.15
    )

    calibrated = np.clip(
        calibrated,
        0,
        255
    )

    return calibrated


# ---------------------------------------------------------
# Prototype classification
# ---------------------------------------------------------

def classify_result(
    delta_e,
    quality,
    confidence
):
    """
    Prototype outcome categories.

    These thresholds are NOT validated forensic
    drug-identification thresholds.

    Ambiguous or poor-quality observations
    are returned as Inconclusive.
    """

    if quality == "Poor":
        return "Inconclusive"

    if confidence < 55:
        return "Inconclusive"

    # Demonstration-only categories.
    #
    # The thresholds are intentionally generic and
    # must not be interpreted as chemical identity
    # thresholds.

    if delta_e <= 8:
        return "Negative"

    if delta_e >= 25:
        return "Positive"

    return "Inconclusive"


# ---------------------------------------------------------
# Main analysis function
# ---------------------------------------------------------

def analyze_color(
    image,
    profile_id=None,
    profile_version=None,
):
    profile_id = profile_id or "UNKNOWN"
    profile_version = profile_version or "UNKNOWN"
    """
    Analyze a captured test image.

    The image is expected to contain:

        Reference Card
              +
        Test Result

    in the standardized capture layout.

    This implementation is for prototype demonstration.
    """

    if image is None:
        raise ValueError(
            "Image is empty."
        )

    if len(image.shape) != 3:
        raise ValueError(
            "Expected a colour image."
        )

    height, width = image.shape[:2]

    if height < 100 or width < 100:
        raise ValueError(
            "Image resolution is too small."
        )

    # -----------------------------------------------------
    # 1. Image quality
    # -----------------------------------------------------

    quality_data = (
        calculate_image_quality(
            image
        )
    )

    quality = quality_data[
        "quality"
    ]

    # -----------------------------------------------------
    # 2. Locate standardized regions
    # -----------------------------------------------------

    #
    # Reference card:
    # upper-middle portion
    #
    reference_region = get_region(
        image,
        0.25,
        0.20,
        0.75,
        0.42
    )

    #
    # Test result:
    # lower-middle portion
    #
    test_region = get_region(
        image,
        0.25,
        0.55,
        0.75,
        0.82
    )

    # -----------------------------------------------------
    # 3. Extract representative colours
    # -----------------------------------------------------

    reference_bgr = (
        get_median_color(
            reference_region
        )
    )

    test_bgr = (
        get_median_color(
            test_region
        )
    )

    # -----------------------------------------------------
    # 4. Relative colour calibration
    # -----------------------------------------------------

    calibrated_test_rgb = (
        calibrate_test_color(
            reference_bgr,
            test_bgr
        )
    )

    calibrated_test_bgr = np.array(
        [
            calibrated_test_rgb[2],
            calibrated_test_rgb[1],
            calibrated_test_rgb[0],
        ],
        dtype=np.float32
    )

    # -----------------------------------------------------
    # 5. Colour representations
    # -----------------------------------------------------

    rgb = bgr_to_rgb(
        calibrated_test_bgr
    )

    hsv = bgr_to_hsv(
        calibrated_test_bgr
    )

    lab = bgr_to_lab(
        calibrated_test_bgr
    )

    reference_lab = bgr_to_lab(
        reference_bgr
    )

    # -----------------------------------------------------
    # 6. Delta E
    # -----------------------------------------------------

    delta_e = calculate_delta_e(
        [
            lab["l"],
            lab["a"],
            lab["b"],
        ],
        [
            reference_lab["l"],
            reference_lab["a"],
            reference_lab["b"],
        ]
    )

    # -----------------------------------------------------
    # 7. Prototype confidence
    # -----------------------------------------------------

    #
    # Smaller Delta E means the observed
    # test colour is closer to the reference.
    #

    color_score = clamp(
        100 - delta_e * 2.5,
        0,
        100
    )

    quality_score = {
        "Good": 100,
        "Fair": 75,
        "Poor": 35,
    }.get(
        quality,
        50
    )

    confidence = (
        color_score * 0.7
        + quality_score * 0.3
    )

    confidence = round(
        clamp(
            confidence,
            0,
            100
        ),
        2
    )

    # -----------------------------------------------------
    # 8. Classification
    # -----------------------------------------------------

    result = classify_result(
        delta_e,
        quality,
        confidence
    )

    # -----------------------------------------------------
    # 9. Return structured analysis
    # -----------------------------------------------------

    return {
        "result": result,

        "confidence": confidence,

        "quality": quality,

        "brightness":
            quality_data[
                "brightness"
            ],

        "contrast":
            quality_data[
                "contrast"
            ],

        "sharpness":
            quality_data[
                "sharpness"
            ],

        "rgb": rgb,

        "hsv": hsv,

        "lab": lab,

        "reference_lab": {
            "l": reference_lab["l"],
            "a": reference_lab["a"],
            "b": reference_lab["b"],
        },

        "delta_e": round(
            delta_e,
            2
        ),

        "calibration": {
            "enabled": True,
            "reference_region": {
                "x_start": 0.25,
                "y_start": 0.20,
                "x_end": 0.75,
                "y_end": 0.42,
            },
            "test_region": {
                "x_start": 0.25,
                "y_start": 0.55,
                "x_end": 0.75,
                "y_end": 0.82,
            },
        },
                "profile": {
            "id": profile_id,
            "version": profile_version,
        },

        "prototype_notice": (
            "Colour classification is a prototype "
            "demonstration and is not a validated "
            "forensic method for identifying "
            "controlled substances. Confirmatory "
            "laboratory testing is required."
        ),
    }