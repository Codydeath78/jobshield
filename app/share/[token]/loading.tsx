import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Opening shared report"
      description="Verifying the secure report link and preparing the redacted evidence."
    />
  );
}