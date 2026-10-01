export default function SharedReportNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-5 dark:bg-black">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
          JobShield
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Report unavailable
        </h1>

        <p className="mt-3 leading-7 text-neutral-500">
          This share link is invalid, expired,
          revoked, or no longer available.
        </p>
      </div>
    </main>
  );
}