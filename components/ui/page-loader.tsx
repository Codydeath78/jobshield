import {
  JobShieldLoader,
} from "@/components/ui/jobshield-loader";


export function PageLoader({
  title =
    "Loading JobShield",

  description =
    "Preparing your workspace and evidence.",
}: {
  title?:
    string;

  description?:
    string;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#06070a]">
      <div className="js-orb left-[-120px] top-[10%] h-[320px] w-[320px] bg-violet-600/15" />

      <div className="js-orb bottom-[5%] right-[-120px] h-[340px] w-[340px] bg-blue-600/10 [animation-delay:-3s]" />


      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-5">
        <div className="js-glass w-full max-w-xl rounded-3xl">
          <JobShieldLoader
            title={
              title
            }
            description={
              description
            }
          />
        </div>
      </div>
    </main>
  );
}