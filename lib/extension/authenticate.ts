import {
  createAdminClient,
} from "@/lib/supabase/admin";

import {
  hashExtensionToken,
  isValidExtensionToken,
} from "@/lib/extension/token";

export async function authenticateExtension(
  request: Request,
) {
  const authorization =
    request.headers.get(
      "authorization",
    );


  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer ",
    )
  ) {
    return null;
  }


  const token =
    authorization
      .slice(
        "Bearer ".length,
      )
      .trim();


  if (
    !isValidExtensionToken(
      token,
    )
  ) {
    return null;
  }


  const supabase =
    createAdminClient();


  const tokenHash =
    hashExtensionToken(
      token,
    );


  const {
    data:
      record,
  } =
    await supabase
      .from(
        "extension_tokens",
      )
      .select(
        `
          id,
          user_id,
          revoked_at
        `,
      )
      .eq(
        "token_hash",
        tokenHash,
      )
      .maybeSingle();


  if (
    !record ||
    record.revoked_at
  ) {
    return null;
  }

  /* A failure to update last_used_at should not break an analysis. */
  await supabase
    .from(
      "extension_tokens",
    )
    .update({
      last_used_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      record.id,
    );


  return {
    supabase,

    userId:
      record.user_id,

    tokenId:
      record.id,
  };
}