import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Opening evidence report"
      description="Loading findings, intelligence sources, and verification results."
    />
  );
}