// Sign-up step one: "What do you make?" as photo cards. A plain GET form, so
// it works without JavaScript; the choice is carried to step two in the URL.
import { IndustryChoice } from "@/features/industries";
import { Button, LineIcon } from "@/ui";

export function IndustryStep({ error }: { error?: string }) {
  return (
    <form method="get" action="/signup" className="flex flex-col gap-6">
      <IndustryChoice invalid={!!error} />
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <Button type="submit" fullWidth>
        Next <LineIcon name="arrow" className="h-4 w-4" />
      </Button>
    </form>
  );
}
