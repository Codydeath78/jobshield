import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

import {
  randomUUID,
} from "node:crypto";

import {
  createAdminClient,
} from "../lib/supabase/admin";

import {
  companyNameTokens,
  normalizeCompanyName,
} from "../lib/analysis/company-name";


const BATCH_SIZE = 500;


type SecRegistryResponse = {
  fields: string[];

  data: Array<
    Array<
      string | number | null
    >
  >;
};


type CompanyRegistryRow = {
  source: "sec";

  cik: number;

  company_name: string;

  normalized_name: string;

  name_tokens: string[];

  ticker: string;

  exchange:
    string | null;

  sync_token: string;

  synced_at: string;
};


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
  rows: CompanyRegistryRow[],
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
          "company_registry_entities",
        )
        .upsert(
          batch,
          {
            onConflict:
              "source,cik,ticker",
          },
        );

    if (error) {
      throw error;
    }

    console.log(
      `  Stored ${Math.min(
        index +
          batch.length,
        rows.length,
      )}/${rows.length}`,
    );
  }
}


async function main() {
  console.log(
    "JobShield Company Registry Sync",
  );

  console.log(
    "================================",
  );

  const registryUrl =
    getEnv(
      "SEC_COMPANY_REGISTRY_URL",
    );

  const userAgent =
    getEnv(
      "SEC_USER_AGENT",
    );

  const syncToken =
    randomUUID();

  console.log(
    "\nDownloading SEC registry...",
  );

  const response =
    await fetch(
      registryUrl,
      {
        headers: {
          "User-Agent":
            userAgent,

          Accept:
            "application/json",
        },

        signal:
          AbortSignal.timeout(
            60_000,
          ),
      },
    );

  if (!response.ok) {
    throw new Error(
      `SEC registry download failed: ${response.status}`,
    );
  }

  const registry =
    (
      await response.json()
    ) as SecRegistryResponse;


  const fieldIndexes =
    new Map(
      registry.fields.map(
        (
          field,
          index,
        ) => [
          field,
          index,
        ],
      ),
    );


  const cikIndex =
    fieldIndexes.get(
      "cik",
    );

  const nameIndex =
    fieldIndexes.get(
      "name",
    );

  const tickerIndex =
    fieldIndexes.get(
      "ticker",
    );

  const exchangeIndex =
    fieldIndexes.get(
      "exchange",
    );


  if (
    cikIndex === undefined ||
    nameIndex === undefined ||
    tickerIndex === undefined
  ) {
    throw new Error(
      "Unexpected SEC registry format.",
    );
  }


  const syncedAt =
    new Date()
      .toISOString();


  const rows:
    CompanyRegistryRow[] = [];


  for (
    const item
    of registry.data
  ) {
    const cik =
      Number(
        item[cikIndex],
      );

    const companyName =
      String(
        item[nameIndex] ??
        "",
      ).trim();

    const ticker =
      String(
        item[
          tickerIndex
        ] ?? "",
      ).trim();

    const exchange =
      exchangeIndex !==
        undefined
        ? String(
            item[
              exchangeIndex
            ] ?? "",
          ).trim()
        : "";


    if (
      !Number.isFinite(
        cik,
      ) ||
      !companyName ||
      !ticker
    ) {
      continue;
    }


    const normalizedName =
      normalizeCompanyName(
        companyName,
      );


    if (
      !normalizedName
    ) {
      continue;
    }


    rows.push({
      source:
        "sec",

      cik,

      company_name:
        companyName,

      normalized_name:
        normalizedName,

      name_tokens:
        companyNameTokens(
          companyName,
        ),

      ticker,

      exchange:
        exchange ||
        null,

      sync_token:
        syncToken,

      synced_at:
        syncedAt,
    });
  }


  if (
    rows.length === 0
  ) {
    throw new Error(
      "SEC registry contained zero usable companies.",
    );
  }


  console.log(
    `  Parsed ${rows.length} registry entries.`,
  );


  await upsertBatches(
    rows,
  );


  const supabase =
    createAdminClient();


  /* Remove stale registry entries only after the new dataset has fully uploaded. */
  const {
    error: cleanupError,
  } =
    await supabase
      .from(
        "company_registry_entities",
      )
      .delete()
      .eq(
        "source",
        "sec",
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
        "company_registry_state",
      )
      .upsert(
        {
          source:
            "sec",

          last_success_at:
            new Date()
              .toISOString(),

          record_count:
            rows.length,

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


  console.log(
    "\nSEC company registry sync complete.",
  );
}


main().catch(
  (error) => {
    console.error(
      "\nCompany registry sync failed:",
      error,
    );

    process.exitCode = 1;
  },
);