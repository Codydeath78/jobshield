"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";


type Candidate = {
  key: string;

  type:
    | "domain"
    | "url";

  label: string;
};


export function ReportScamControls({
  analysisId,
  candidates,
  initialActive,
}: {
  analysisId: string;

  candidates:
    Candidate[];

  initialActive:
    boolean;
}) {
  const router =
    useRouter();


  const [
    active,
    setActive,
  ] =
    useState(
      initialActive,
    );


  const [
    reason,
    setReason,
  ] =
    useState(
      "fake_recruiter",
    );


  const [
    selected,
    setSelected,
  ] =
    useState<
      string[]
    >([]);


  const [
    loading,
    setLoading,
  ] =
    useState(false);


  const [
    error,
    setError,
  ] =
    useState("");


  function toggle(
    key: string,
  ) {
    setSelected(
      (current) => {
        if (
          current.includes(
            key,
          )
        ) {
          return current.filter(
            (item) =>
              item !== key,
          );
        }


        if (
          current.length >=
          5
        ) {
          return current;
        }


        return [
          ...current,
          key,
        ];
      },
    );
  }

  async function submit() {
    if (
      selected.length ===
      0
    ) {
      setError(
        "Select at least one suspicious indicator.",
      );

      return;
    }

    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          "/api/community-reports",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                analysisId,
                reason,
                selectedKeys:
                  selected,
              }),
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not submit report.",
        );
      }


      setActive(
        true,
      );


      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not submit report.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  async function withdraw() {
    setLoading(
      true,
    );

    setError("");


    try {
      const response =
        await fetch(
          `/api/community-reports/${analysisId}`,
          {
            method:
              "DELETE",
          },
        );


      const data =
        await response.json();


      if (!response.ok) {
        throw new Error(
          data.error ||
          "Could not withdraw report.",
        );
      }


      setActive(
        false,
      );

      setSelected(
        [],
      );


      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not withdraw report.",
      );
    } finally {
      setLoading(
        false,
      );
    }
  }


  if (
    candidates.length ===
    0
  ) {
    return (
      <div>
        <h2 className="text-lg font-semibold">
          Community report
        </h2>

        <p className="mt-2 text-sm text-neutral-500">
          No URL or domain indicators are
          available to report from this
          analysis.
        </p>
      </div>
    );
  }


  if (active) {
    return (
      <div>
        <h2 className="text-lg font-semibold">
          Community report
        </h2>

        <div className="mt-4 rounded-xl border p-4">
          <p className="font-medium">
            Report submitted
          </p>

          <p className="mt-2 text-sm leading-6 text-neutral-500">
            Your report contributes one
            independent community observation.
            Repeated analyses from the same
            account do not count as additional
            independent reporters.
          </p>

          <button
            type="button"
            disabled={
              loading
            }
            onClick={
              withdraw
            }
            className="mt-4 text-sm font-medium underline"
          >
            {loading
              ? "Withdrawing..."
              : "Withdraw report"}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }


  return (
    <div>
      <h2 className="text-lg font-semibold">
        Report suspicious activity
      </h2>

      <p className="mt-2 text-sm leading-6 text-neutral-500">
        Select the specific indicators you
        believe were involved. Community reports
        are treated as unverified observations
        and require independent corroboration
        before affecting risk.
      </p>


      <label className="mt-5 block text-sm font-medium">
        Reason
      </label>

      <select
        value={
          reason
        }
        onChange={(
          event,
        ) =>
          setReason(
            event.target.value,
          )
        }
        className="mt-2 rounded-lg border bg-transparent px-3 py-2"
      >
        <option value="fake_recruiter">
          Fake recruiter
        </option>

        <option value="phishing">
          Phishing
        </option>

        <option value="check_scam">
          Check scam
        </option>

        <option value="advance_fee">
          Advance-fee scam
        </option>

        <option value="impersonation">
          Company impersonation
        </option>

        <option value="malware">
          Malware
        </option>

        <option value="other">
          Other suspicious activity
        </option>
      </select>


      <div className="mt-5 space-y-2">
        {candidates.map(
          (
            candidate,
          ) => {
            const checked =
              selected.includes(
                candidate.key,
              );


            return (
              <label
                key={
                  candidate.key
                }
                className="flex cursor-pointer gap-3 rounded-xl border p-4"
              >
                <input
                  type="checkbox"
                  checked={
                    checked
                  }
                  onChange={() =>
                    toggle(
                      candidate.key,
                    )
                  }
                />

                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase text-neutral-500">
                    {
                      candidate.type
                    }
                  </p>

                  <p className="mt-1 break-all text-sm">
                    {
                      candidate.label
                    }
                  </p>
                </div>
              </label>
            );
          },
        )}
      </div>


      <p className="mt-3 text-xs text-neutral-500">
        Select up to 5 indicators.
      </p>


      <button
        type="button"
        disabled={
          loading ||
          selected.length ===
            0
        }
        onClick={
          submit
        }
        className="mt-4 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-white dark:text-black"
      >
        {loading
          ? "Submitting..."
          : "Submit Community Report"}
      </button>


      {error && (
        <p className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}