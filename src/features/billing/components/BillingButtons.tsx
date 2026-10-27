"use client";
// "Choose plan" (Stripe Checkout) and "Manage billing" (Stripe portal) buttons.
// Each is a small form, so it also works before JavaScript loads.
import { FormStatus, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { openBillingPortal, startCheckout } from "../server/actions";

type CheckoutButtonProps = { plan: "STARTER" | "GROWTH"; interval: "month" | "year"; label: string; primary?: boolean };

export function CheckoutButton({ plan, interval, label, primary }: CheckoutButtonProps) {
  const { result, pending, formProps } = useFormAction(startCheckout);
  return (
    <form {...formProps} className="flex flex-col gap-2">
      <input type="hidden" name="plan" value={plan} />
      <input type="hidden" name="interval" value={interval} />
      <SubmitButton variant={primary ? "primary" : "secondary"} pending={pending} pendingLabel="Opening checkout…" fullWidth>
        {label}
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}

export function PortalButton() {
  const { result, pending, formProps } = useFormAction(openBillingPortal);
  return (
    <form {...formProps} className="flex flex-col gap-2">
      <SubmitButton variant="secondary" pending={pending} pendingLabel="Opening…">
        Manage billing, card and invoices
      </SubmitButton>
      <FormStatus result={result} />
    </form>
  );
}
