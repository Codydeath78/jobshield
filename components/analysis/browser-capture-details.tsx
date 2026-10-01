import {
  CheckCircle2,
  Crop,
  Globe2,
  ShieldCheck,
} from "lucide-react";


type BrowserCaptureDetailsProps = {
  inputMetadata:
    unknown;
};


type ScreenshotMetadata = {
  source?:
    string;

  captureType?:
    string;

  sourceHost?:
    string | null;

  pixelWidth?:
    number | null;

  pixelHeight?:
    number | null;

  rawImageStored?:
    boolean;

  privacy?: {
    fullViewportUploaded?:
      boolean;

    croppedRegionUploaded?:
      boolean;

    rawImageRetained?:
      boolean;
  };
};


function getScreenshotMetadata(
  inputMetadata:
    unknown,
):
  ScreenshotMetadata |
  null {
  if (
    !inputMetadata ||
    typeof inputMetadata !==
      "object"
  ) {
    return null;
  }


  const metadata =
    inputMetadata as {
      screenshot?:
        unknown;
    };


  if (
    !metadata.screenshot ||
    typeof metadata.screenshot !==
      "object"
  ) {
    return null;
  }


  return metadata.screenshot as
    ScreenshotMetadata;
}


function formatCaptureType(
  value:
    string | undefined,
) {
  if (
    value ===
    "selected_region"
  ) {
    return "Selected region";
  }


  return value
    ? value
        .replace(
          /_/g,
          " ",
        )
        .replace(
          /\b\w/g,
          (
            letter,
          ) =>
            letter.toUpperCase(),
        )
    : "Unknown";
}


export function BrowserCaptureDetails({
  inputMetadata,
}:
  BrowserCaptureDetailsProps) {
  const screenshot =
    getScreenshotMetadata(
      inputMetadata,
    );


  /* Only show this section for screenshots captured through the browser extension. */
  if (
    !screenshot ||
    screenshot.source !==
      "browser_extension"
  ) {
    return null;
  }

  const dimensions =
    screenshot.pixelWidth &&
    screenshot.pixelHeight
      ? `${screenshot.pixelWidth.toLocaleString()} × ${screenshot.pixelHeight.toLocaleString()}`
      : "Unavailable";


  return (
    <section className="js-glass rounded-3xl p-6">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10">
            <Crop className="h-5 w-5 text-violet-300" />
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-violet-300">
              Browser Capture
            </p>

            <h2 className="mt-1 text-lg font-semibold">
              Selected-region evidence
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-neutral-500">
              This evidence originated from a
              user-selected browser region rather
              than a full-page upload.
            </p>
          </div>
        </div>


        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />

          Privacy protected
        </div>
      </div>


      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="js-card rounded-2xl p-4">
          <div className="flex items-center gap-2 text-neutral-500">
            <Globe2 className="h-4 w-4" />

            <p className="text-xs font-medium uppercase tracking-wide">
              Source website
            </p>
          </div>

          <p className="mt-2 break-all text-sm font-semibold">
            {screenshot.sourceHost ||
              "Unavailable"}
          </p>
        </div>


        <div className="js-card rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Capture type
          </p>

          <p className="mt-2 text-sm font-semibold">
            {formatCaptureType(
              screenshot.captureType,
            )}
          </p>
        </div>


        <div className="js-card rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Selected region
          </p>

          <p className="mt-2 text-sm font-semibold">
            {dimensions}
          </p>
        </div>


        <div className="js-card rounded-2xl p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Image retained
          </p>

          <p className="mt-2 text-sm font-semibold">
            {screenshot.rawImageStored ===
            true
              ? "Yes"
              : "No"}
          </p>
        </div>
      </div>


      <div className="mt-5 rounded-2xl border border-emerald-400/15 bg-emerald-500/[0.06] p-4">
        <div className="flex gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

          <div>
            <p className="text-sm font-semibold text-emerald-200">
              Privacy-preserving browser capture
            </p>

            <div className="mt-2 space-y-1.5 text-sm leading-6 text-neutral-400">
              <p>
                Only the region selected by the
                user was uploaded to JobShield.
              </p>

              <p>
                The temporary full browser
                viewport was not uploaded.
              </p>

              <p>
                The submitted screenshot image
                was processed for analysis but
                was not retained.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}