import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Loading investigations"
      description="Reconstructing your multi-artifact case workspace."
    />
  );
}