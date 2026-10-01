import {
  ScanSearch,
} from "lucide-react";


export function JobShieldLoader({
  title =
    "Analyzing evidence",

  description =
    "JobShield is evaluating the available signals.",
}: {
  title?:
    string;

  description?:
    string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative">
        <div className="js-scanner">
          <ScanSearch
            className="h-10 w-10"
            strokeWidth={1.5}
          />
        </div>

        <div className="js-orbit" />
      </div>


      <h2 className="mt-7 text-xl font-semibold tracking-tight">
        {title}
      </h2>


      <p className="mt-2 max-w-md text-sm leading-6 text-neutral-500">
        {description}
      </p>


      <div className="mt-5">
        <span className="js-loading-dot" />
        <span className="js-loading-dot" />
        <span className="js-loading-dot" />
      </div>
    </div>
  );
}