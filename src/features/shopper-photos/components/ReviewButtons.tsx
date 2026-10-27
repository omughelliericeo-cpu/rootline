"use client";
// Approve / Reject for one waiting photo. One form, two buttons: the pressed
// button's value is sent as "decision". Works without JavaScript.
import { FormStatus, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { reviewShopperPhoto } from "../server/review-actions";

export function ReviewButtons({ photoId }: { photoId: string }) {
  const { result, pending, formProps } = useFormAction(reviewShopperPhoto);

  return (
    <form {...formProps} className="flex flex-col gap-2">
      <input type="hidden" name="photoId" value={photoId} />
      <div className="flex flex-wrap gap-3">
        <SubmitButton name="decision" value="approve" pending={pending} pendingLabel="Saving…">
          Approve
        </SubmitButton>
        <SubmitButton name="decision" value="reject" variant="secondary" pending={pending} pendingLabel="Saving…">
          Reject
        </SubmitButton>
      </div>
      <FormStatus result={result} />
    </form>
  );
}
