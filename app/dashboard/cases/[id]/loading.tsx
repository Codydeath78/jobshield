import {
  PageLoader,
} from "@/components/ui/page-loader";


export default function Loading() {
  return (
    <PageLoader
      title="Opening investigation"
      description="Loading the case timeline and linked evidence."
    />
  );
}