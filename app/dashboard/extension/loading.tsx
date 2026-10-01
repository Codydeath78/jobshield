import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Loading browser connections"
      description="Checking your JobShield extension connections."
    />
  );
}