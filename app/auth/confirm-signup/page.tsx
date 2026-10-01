export const instant =
  false;


import {
  ConfirmSignupForm,
} from "@/components/confirm-signup-form";


type ConfirmSignupPageProps = {
  searchParams:
    Promise<{
      token_hash?:
        string;
    }>;
};


export default async function ConfirmSignupPage({
  searchParams,
}: ConfirmSignupPageProps) {
  const params =
    await searchParams;


  const tokenHash =
    typeof params.token_hash ===
      "string"
      ? params.token_hash
          .trim()
          .slice(
            0,
            2048,
          )
      : null;


  return (
    <ConfirmSignupForm
      tokenHash={
        tokenHash
      }
    />
  );
}