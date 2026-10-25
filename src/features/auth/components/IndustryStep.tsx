// Sign-up step one: "What do you make?". A plain GET form, so it works
// without JavaScript; the choice is carried to step two in the URL.
import { industryOptions } from "@/features/industries";
import { Button, Card, Field, Select } from "@/ui";

export function IndustryStep({ error }: { error?: string }) {
  return (
    <Card>
      <form method="get" action="/signup" className="flex flex-col gap-5">
        <Field
          id="industry"
          label="What do you make?"
          hint="This sets up the right words, dates and badges for your products."
          error={error}
        >
          <Select id="industry" name="industry" placeholder="Choose one" options={industryOptions()} required invalid={!!error} />
        </Field>
        <Button type="submit" fullWidth>
          Continue
        </Button>
      </form>
    </Card>
  );
}
