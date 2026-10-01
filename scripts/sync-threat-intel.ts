import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import { randomUUID } from "node:crypto";

import { parse } from "csv-parse/sync";

import { createAdminClient } from "../lib/supabase/admin";

import {
  hashThreatUrl,
  hostnameFromUrl,
  normalizeThreatUrl,
} from "../lib/security/url-normalization";


type ThreatSource =
  | "phishing_database"
  | "urlhaus";


type IndicatorRow = {
  source: ThreatSource;

  url_hash: string;

  indicator_url: string;

  hostname: string;

  threat_type:
    | "phishing"
    | "malware";

  external_id:
    | string
    | null;

  target:
    | string
    | null;

  first_seen:
    | string
    | null;

  active: boolean;

  metadata: Record<
    string,
    unknown
  >;

  sync_token: string;

  synced_at: string;
};


const BATCH_SIZE = 500;

const USER_AGENT =
  "JobShield-threat-intel-sync/0.2";


function getEnv(
  name: string,
): string {
  const value =
    process.env[name];

  if (!value) {
    throw new Error(
      `${name} is missing.`,
    );
  }

  return value;
}

async function upsertBatches(
  rows: IndicatorRow[],
) {
  const supabase =
    createAdminClient();

  for (
    let index = 0;
    index < rows.length;
    index += BATCH_SIZE
  ) {
    const batch =
      rows.slice(
        index,
        index + BATCH_SIZE,
      );

    const {
      error,
    } =
      await supabase
        .from(
          "threat_url_indicators",
        )
        .upsert(
          batch,
          {
            onConflict:
              "source,url_hash",
          },
        );

    if (error) {
      throw error;
    }

    console.log(
      `  Stored ${Math.min(
        index + batch.length,
        rows.length,
      )}/${rows.length}`,
    );
  }
}


async function finalizeSource(
  source: ThreatSource,
  syncToken: string,
  recordCount: number,
) {
  const supabase =
    createAdminClient();

  /* Remove records belonging to the previous version of this provider's feed only AFTER the new feed has been fully inserted. */
  const {
    error: cleanupError,
  } =
    await supabase
      .from(
        "threat_url_indicators",
      )
      .delete()
      .eq(
        "source",
        source,
      )
      .neq(
        "sync_token",
        syncToken,
      );

  if (cleanupError) {
    throw cleanupError;
  }

  const {
    error: stateError,
  } =
    await supabase
      .from(
        "threat_feed_state",
      )
      .upsert(
        {
          source,

          last_success_at:
            new Date()
              .toISOString(),

          record_count:
            recordCount,

          sync_token:
            syncToken,

          updated_at:
            new Date()
              .toISOString(),
        },

        {
          onConflict:
            "source",
        },
      );

  if (stateError) {
    throw stateError;
  }
}

// PHISHING.DATABASE
async function syncPhishingDatabase() {
  console.log(
    "\nSyncing Phishing.Database...",
  );

  const feedUrl =
    getEnv(
      "PHISHING_DATABASE_FEED_URL",
    );

  const syncToken =
    randomUUID();

  const response =
    await fetch(
      feedUrl,
      {
        headers: {
          "User-Agent":
            USER_AGENT,

          Accept:
            "text/plain,*/*",
        },

        signal:
          AbortSignal.timeout(
            60_000,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      `Phishing.Database download failed: ${response.status}`,
    );
  }

  const raw =
    await response.text();

  const urls =
    raw
      .split(/\r?\n/)
      .map(
        (line) =>
          line.trim(),
      )
      .filter(
        (line) =>
          line.length > 0 &&
          !line.startsWith("#"),
      );

  const seen =
    new Map<
      string,
      IndicatorRow
    >();

  const syncedAt =
    new Date()
      .toISOString();

  for (
    const rawUrl of urls
  ) {
    const normalized =
      normalizeThreatUrl(
        rawUrl,
      );

    if (!normalized) {
      continue;
    }

    const hostname =
      hostnameFromUrl(
        normalized,
      );

    if (!hostname) {
      continue;
    }

    const urlHash =
      hashThreatUrl(
        normalized,
      );

    seen.set(
      urlHash,
      {
        source:
          "phishing_database",

        url_hash:
          urlHash,

        indicator_url:
          normalized,

        hostname,

        threat_type:
          "phishing",

        external_id:
          null,

        target:
          null,

        first_seen:
          null,

        /* We specifically download their ACTIVE phishing-link feed. */
        active:
          true,

        metadata: {
          feed:
            "phishing-links-ACTIVE",
        },

        sync_token:
          syncToken,

        synced_at:
          syncedAt,
      },
    );
  }

  const rows =
    Array.from(
      seen.values(),
    );

  console.log(
    `  Parsed ${rows.length} active phishing URLs.`,
  );

  if (rows.length === 0) {
    throw new Error(
      "Phishing.Database feed contained zero usable URLs.",
    );
  }

  await upsertBatches(
    rows,
  );

  await finalizeSource(
    "phishing_database",
    syncToken,
    rows.length,
  );

  console.log(
    "  Phishing.Database sync complete.",
  );
}

// URLHAUS
function prepareUrlhausCsv(
  raw: string,
): string {
  const lines =
    raw.split(/\r?\n/);

  let header:
    string | null =
      null;

  const dataLines:
    string[] = [];

  for (
    const originalLine
    of lines
  ) {
    const trimmed =
      originalLine.trim();

    if (!trimmed) {
      continue;
    }

    if (
      trimmed.startsWith(
        "#",
      )
    ) {
      const candidate =
        trimmed.replace(
          /^#\s*/,
          "",
        );

      const lower =
        candidate.toLowerCase();

      if (
        lower.includes(
          "url",
        ) &&
        (
          lower.includes(
            "id",
          ) ||
          lower.includes(
            "dateadded",
          )
        )
      ) {
        header =
          candidate;
      }

      continue;
    }

    dataLines.push(
      originalLine,
    );
  }

  if (
    dataLines.length >
      0
  ) {
    const first =
      dataLines[0]
        .toLowerCase();

    if (
      first.includes(
        "url",
      ) &&
      (
        first.includes(
          "id",
        ) ||
        first.includes(
          "dateadded",
        )
      )
    ) {
      return dataLines.join(
        "\n",
      );
    }
  }

  if (!header) {
    throw new Error(
      "Could not detect URLhaus CSV header.",
    );
  }

  return [
    header,
    ...dataLines,
  ].join("\n");
}


type UrlhausRow =
  Record<
    string,
    string | undefined
  >;


function getField(
  row: UrlhausRow,
  ...names: string[]
): string | null {
  const entries =
    Object.entries(row);

  for (
    const name of names
  ) {
    const match =
      entries.find(
        ([key]) =>
          key
            .trim()
            .toLowerCase() ===
          name.toLowerCase(),
      );

    const value =
      match?.[1]
        ?.trim();

    if (value) {
      return value;
    }
  }

  return null;
}


async function syncUrlhaus() {
  console.log(
    "\nSyncing URLhaus...",
  );

  const feedUrl =
    getEnv(
      "URLHAUS_FEED_URL",
    );

  const syncToken =
    randomUUID();

  const response =
    await fetch(
      feedUrl,
      {
        headers: {
          "User-Agent":
            USER_AGENT,

          Accept:
            "text/csv,*/*",
        },

        signal:
          AbortSignal.timeout(
            60_000,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      `URLhaus download failed: ${response.status}`,
    );
  }

  const raw =
    await response.text();

  const cleanedCsv =
    prepareUrlhausCsv(
      raw,
    );

  const parsed =
    parse(
      cleanedCsv,
      {
        columns: true,

        skip_empty_lines:
          true,

        bom: true,

        relax_quotes:
          true,

        relax_column_count:
          true,

        trim: true,
      },
    ) as UrlhausRow[];

  const seen =
    new Map<
      string,
      IndicatorRow
    >();

  const syncedAt =
    new Date()
      .toISOString();

  for (
    const item of parsed
  ) {
    const rawUrl =
      getField(
        item,
        "url",
      );

    if (!rawUrl) {
      continue;
    }

    const normalized =
      normalizeThreatUrl(
        rawUrl,
      );

    if (!normalized) {
      continue;
    }

    const hostname =
      hostnameFromUrl(
        normalized,
      );

    if (!hostname) {
      continue;
    }

    const urlHash =
      hashThreatUrl(
        normalized,
      );

    const status =
      getField(
        item,
        "url_status",
        "status",
      );

    seen.set(
      urlHash,
      {
        source:
          "urlhaus",

        url_hash:
          urlHash,

        indicator_url:
          normalized,

        hostname,

        threat_type:
          "malware",

        external_id:
          getField(
            item,
            "id",
            "urlhaus_id",
          ),

        target:
          null,

        first_seen:
          getField(
            item,
            "dateadded",
            "date_added",
            "first_seen",
          ),

        active:
          status
            ? status
                .toLowerCase() ===
              "online"
            : true,

        metadata: {
          status,

          threat:
            getField(
              item,
              "threat",
            ),

          tags:
            getField(
              item,
              "tags",
            ),

          urlhaus_link:
            getField(
              item,
              "urlhaus_link",
              "link",
            ),
        },

        sync_token:
          syncToken,

        synced_at:
          syncedAt,
      },
    );
  }

  const rows =
    Array.from(
      seen.values(),
    );

  console.log(
    `  Parsed ${rows.length} malware URLs.`,
  );

  if (rows.length === 0) {
    throw new Error(
      "URLhaus feed contained zero usable URLs.",
    );
  }

  await upsertBatches(
    rows,
  );

  await finalizeSource(
    "urlhaus",
    syncToken,
    rows.length,
  );

  console.log(
    "  URLhaus sync complete.",
  );
}

// MAIN
async function main() {
  console.log(
    "JobShield Threat Intelligence Sync",
  );

  console.log(
    "=================================",
  );

  await syncPhishingDatabase();

  await syncUrlhaus();

  console.log(
    "\nThreat intelligence sync completed.",
  );
}

main().catch(
  (error) => {
    console.error(
      "\nThreat intelligence sync failed:",
      error,
    );

    process.exitCode = 1;
  },
);