import {
  createHash,
  randomBytes,
} from "node:crypto";

const TOKEN_BYTES = 32;

const TOKEN_PATTERN =
  /^[A-Za-z0-9_-]{43}$/;

export function generateExtensionToken() {
  const token =
    randomBytes(
      TOKEN_BYTES,
    ).toString(
      "base64url",
    );

  return {
    token,

    tokenHash:
      hashExtensionToken(
        token,
      ),

    tokenPrefix:
      token.slice(
        0,
        8,
      ),
  };
}

export function hashExtensionToken(
  token: string,
) {
  return createHash(
    "sha256",
  )
    .update(
      token,
    )
    .digest(
      "hex",
    );
}

export function isValidExtensionToken(
  token: string,
) {
  return TOKEN_PATTERN.test(
    token,
  );
}