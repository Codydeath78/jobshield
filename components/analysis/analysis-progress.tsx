"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  BrainCircuit,
  Globe2,
  Radar,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

import type {
  AnalysisType,
} from "@/lib/analysis/types";


export function AnalysisProgress({
  analysisType,
}: {
  analysisType:
    AnalysisType;
}) {
  const [
    currentStep,
    setCurrentStep,
  ] =
    useState(
      0,
    );


  const steps =
    useMemo(
      () => {
        const first =
          analysisType ===
          "screenshot"
            ? "Reading screenshot"
            : analysisType ===
                "job_offer"
              ? "Extracting document"
              : analysisType ===
                  "email_file"
                ? "Parsing email headers"
                : analysisType ===
                    "browser_selection"
                  ? "Processing selected text"
                  : "Reading submitted content";


        return [
          first,
          "Checking scam patterns",
          "Reviewing contextual signals",
          "Verifying domains and URLs",
          "Combining evidence",
        ];
      },
      [
        analysisType,
      ],
    );


  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setCurrentStep(
            (
              current,
            ) =>
              (
                current +
                1
              ) %
              steps.length,
          );
        },
        1250,
      );


    return () =>
      window.clearInterval(
        interval,
      );
  }, [
    steps.length,
  ]);


  const icons = [
    ScanSearch,
    Radar,
    BrainCircuit,
    Globe2,
    ShieldCheck,
  ];


  return (
    <div className="js-glass js-page-enter mt-6 overflow-hidden rounded-2xl p-6">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <div className="js-scanner h-16 w-16 rounded-2xl">
            <ScanSearch
              className="h-6 w-6"
            />
          </div>
        </div>


        <div>
          <p className="text-sm font-semibold">
            JobShield is analyzing this submission
          </p>

          <p className="mt-1 text-xs text-neutral-500">
            Multiple independent detection systems are running.
          </p>
        </div>
      </div>


      <div className="mt-6 grid gap-2">
        {steps.map(
          (
            step,
            index,
          ) => {
            const Icon =
              icons[index];

            const active =
              index ===
              currentStep;


            return (
              <div
                key={
                  step
                }
                className={[
                  "flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300",

                  active
                    ? "border-violet-400/30 bg-violet-500/10"
                    : "border-white/5 bg-white/[0.015] opacity-45",
                ].join(
                  " ",
                )}
              >
                <Icon
                  className={[
                    "h-4 w-4 transition-transform duration-300",

                    active
                      ? "scale-110"
                      : "",
                  ].join(
                    " ",
                  )}
                />

                <span className="text-sm">
                  {step}
                </span>

                {active && (
                  <div className="ml-auto">
                    <span className="js-loading-dot" />
                    <span className="js-loading-dot" />
                    <span className="js-loading-dot" />
                  </div>
                )}
              </div>
            );
          },
        )}
      </div>


      <p className="mt-4 text-xs text-neutral-500">
        Signal animations are illustrative and do not represent exact subsystem completion percentages.
      </p>
    </div>
  );
}