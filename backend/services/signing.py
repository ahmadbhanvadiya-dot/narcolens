import base64
import hashlib
import json
import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import (
    Ed25519PrivateKey,
    Ed25519PublicKey,
)


ALGORITHM = "Ed25519"


def _get_private_key() -> Ed25519PrivateKey:
    encoded_key = os.getenv("NARCOLENS_PRIVATE_KEY")

    if not encoded_key:
        raise RuntimeError("NARCOLENS_PRIVATE_KEY is not configured.")

    try:
        key_bytes = base64.b64decode(encoded_key)
        return Ed25519PrivateKey.from_private_bytes(key_bytes)
    except Exception as error:
        raise RuntimeError(
            f"Invalid NARCOLENS_PRIVATE_KEY: {error}"
        )


def _get_public_key() -> Ed25519PublicKey:
    encoded_key = os.getenv("NARCOLENS_PUBLIC_KEY")

    if not encoded_key:
        raise RuntimeError("NARCOLENS_PUBLIC_KEY is not configured.")

    try:
        key_bytes = base64.b64decode(encoded_key)
        return Ed25519PublicKey.from_public_bytes(key_bytes)
    except Exception as error:
        raise RuntimeError(
            f"Invalid NARCOLENS_PUBLIC_KEY: {error}"
        )


def canonicalize_payload(payload: dict) -> bytes:
    """
    Convert a record payload into a deterministic byte representation.

    The exact same payload will always produce the exact same bytes.
    """

    canonical_json = json.dumps(
        payload,
        sort_keys=True,
        separators=(",", ":"),
        ensure_ascii=False,
    )

    return canonical_json.encode("utf-8")


def hash_payload(payload: dict) -> str:
    """
    SHA-256 hash of the canonical record payload.
    """

    canonical_bytes = canonicalize_payload(payload)

    return hashlib.sha256(canonical_bytes).hexdigest()


def sign_payload(payload: dict) -> dict:
    """
    Create an Ed25519 digital signature for the record payload.
    """

    canonical_bytes = canonicalize_payload(payload)

    private_key = _get_private_key()

    signature = private_key.sign(canonical_bytes)

    key_id = os.getenv(
        "NARCOLENS_SIGNING_KEY_ID",
        "narcolens-demo-key-01",
    )

    return {
        "signature": base64.b64encode(signature).decode("utf-8"),
        "signature_algorithm": ALGORITHM,
        "signing_key_id": key_id,
        "record_payload_hash": hashlib.sha256(
            canonical_bytes
        ).hexdigest(),
    }


def verify_signature(
    payload: dict,
    signature: str,
) -> bool:
    """
    Verify an Ed25519 signature against the canonical payload.
    """

    try:
        canonical_bytes = canonicalize_payload(payload)
        signature_bytes = base64.b64decode(signature)

        public_key = _get_public_key()

        public_key.verify(
            signature_bytes,
            canonical_bytes,
        )

        return True

    except Exception:
        return False