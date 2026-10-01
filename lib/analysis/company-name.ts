const LEGAL_SUFFIXES =
  new Set([
    "inc",
    "incorporated",
    "corp",
    "corporation",
    "co",
    "company",
    "ltd",
    "limited",
    "llc",
    "plc",
    "lp",
    "llp",
    "sa",
    "ag",
    "se",
    "nv",
  ]);


function cleanRawCompanyName(
  value: string,
): string {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )

    // EDGAR often has qualifiers
    // such as /DE/, /MD/, /NEW/.
    .replace(
      /\/[^/]{1,12}\/?/g,
      " ",
    )

    .replace(
      /&/g,
      " and ",
    )

    .toLowerCase()

    .replace(
      /[^a-z0-9]+/g,
      " ",
    )

    .replace(
      /\s+/g,
      " ",
    )

    .trim();
}


export function companyNameTokens(
  value: string,
): string[] {
  const cleaned =
    cleanRawCompanyName(
      value,
    );

  const tokens =
    cleaned
      .split(" ")
      .filter(Boolean);

  /* Strip legal suffixes from the END. */
  while (
    tokens.length > 1 &&
    LEGAL_SUFFIXES.has(
      tokens[
        tokens.length - 1
      ],
    )
  ) {
    tokens.pop();
  }

  return tokens;
}


export function normalizeCompanyName(
  value: string,
): string {
  return companyNameTokens(
    value,
  ).join(" ");
}


export function scoreCompanyNameMatch(
  claimedName: string,
  registryName: string,
): number {
  const claimed =
    normalizeCompanyName(
      claimedName,
    );

  const registry =
    normalizeCompanyName(
      registryName,
    );

  if (
    !claimed ||
    !registry
  ) {
    return 0;
  }

  if (
    claimed === registry
  ) {
    return 1;
  }

  const claimedCompact =
    claimed.replace(
      /\s+/g,
      "",
    );

  const registryCompact =
    registry.replace(
      /\s+/g,
      "",
    );

  if (
    claimedCompact ===
    registryCompact
  ) {
    return 0.99;
  }

  const claimedTokens =
    new Set(
      claimed.split(" "),
    );

  const registryTokens =
    new Set(
      registry.split(" "),
    );

  const intersection =
    [...claimedTokens]
      .filter(
        (token) =>
          registryTokens.has(
            token,
          ),
      )
      .length;

  if (
    intersection === 0
  ) {
    return 0;
  }

  const union =
    new Set([
      ...claimedTokens,
      ...registryTokens,
    ]).size;

  const jaccard =
    intersection / union;

  const containment =
    intersection /
    Math.min(
      claimedTokens.size,
      registryTokens.size,
    );

  return (
    containment * 0.7 +
    jaccard * 0.3
  );
}


export function companyNameMatchesDomain(
  companyName: string,
  domain: string,
): boolean {
  const tokens =
    companyNameTokens(
      companyName,
    );

  if (
    tokens.length === 0
  ) {
    return false;
  }

  const firstLabel =
    domain
      .toLowerCase()
      .split(".")[0]
      .replace(
        /[^a-z0-9]/g,
        "",
      );

  if (
    firstLabel.length < 4
  ) {
    return false;
  }

  const compact =
    tokens.join("");

  if (
    compact === firstLabel
  ) {
    return true;
  }

  if (
    compact.startsWith(
      firstLabel,
    ) &&
    firstLabel.length >= 5
  ) {
    return true;
  }

  if (
    firstLabel.startsWith(
      compact,
    ) &&
    compact.length >= 5
  ) {
    return true;
  }

  return tokens.some(
    (token) =>
      token.length >= 5 &&
      token === firstLabel,
  );
}