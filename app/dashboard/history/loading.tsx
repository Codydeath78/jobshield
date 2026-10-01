import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Loading analysis history"
      description="Retrieving your previous evidence reports."
    />
  );
}