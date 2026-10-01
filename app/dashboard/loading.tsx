import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Opening JobShield"
      description="Loading your analyses, investigations, and threat intelligence."
    />
  );
}