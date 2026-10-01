import {
  createHash,
  randomBytes,
} from "node:crypto";


const SHARE_TOKEN_BYTES =
  32;


/* 32 bytes encoded as base64url produces a 43-character secret token. */
const SHARE_TOKEN_REGEX =
  /^[A-Za-z0-9_-]{43}$/;


export function generateShareToken() {
  const token =
    randomBytes(
      SHARE_TOKEN_BYTES,
    ).toString(
      "base64url",
    );

  return {
    token,

    tokenHash:
      hashShareToken(
        token,
      ),

    tokenPrefix:
      token.slice(
        0,
        8,
      ),
  };
}


export function hashShareToken(
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


export function isValidShareToken(
  token: string,
) {
  return SHARE_TOKEN_REGEX.test(
    token,
  );
}