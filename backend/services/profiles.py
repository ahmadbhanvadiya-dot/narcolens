"""
NarcoLens Test Profiles

Stores versioned metadata for supported field-test methods.

Important:
The profiles below define the software identity of a test method.
They do NOT contain validated forensic colour thresholds.

Validated reference values must come from the appropriate
manufacturer/laboratory validation data before production use.
"""


# ---------------------------------------------------------
# Profile definitions
# ---------------------------------------------------------

PROFILES = {
    "MARQUIS": {
        "id": "MARQUIS",
        "version": "1.0",
        "name": "Marquis Reagent",
        "status": "prototype",
    },

    "SCOTT": {
        "id": "SCOTT",
        "version": "1.0",
        "name": "Cobalt Thiocyanate (Scott Test)",
        "status": "prototype",
    },

    "DUQUENOIS_LEVINE": {
        "id": "DUQUENOIS_LEVINE",
        "version": "1.0",
        "name": "Duquenois-Levine Test",
        "status": "prototype",
    },

    "EHRLICH": {
        "id": "EHRLICH",
        "version": "1.0",
        "name": "Ehrlich's Reagent",
        "status": "prototype",
    },
}


# ---------------------------------------------------------
# Profile lookup
# ---------------------------------------------------------

def get_profile(
    profile_id: str,
    profile_version: str = "1.0",
):
    """
    Return a matching test profile.

    Returns None when the requested profile/version
    is not registered.
    """

    profile = PROFILES.get(profile_id)

    if profile is None:
        return None

    if profile["version"] != profile_version:
        return None

    return profile


# ---------------------------------------------------------
# Profile validation
# ---------------------------------------------------------

def profile_exists(
    profile_id: str,
    profile_version: str = "1.0",
) -> bool:
    """
    Check whether a profile/version combination exists.
    """

    return (
        get_profile(
            profile_id,
            profile_version,
        )
        is not None
    )