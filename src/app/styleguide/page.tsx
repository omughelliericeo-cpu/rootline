// Development-only page showing the design tokens and /src/ui components, so
// the look can be reviewed against the Figma file. Returns 404 in production.
import { notFound } from "next/navigation";
import { Badge, Button, Card, Field, Input, LineIcon, PageShell, Select, Stepper, Table, Td, Textarea, Th } from "@/ui";

const COLOURS = [
  { name: "cream", className: "bg-cream", hex: "#F6F1E7" },
  { name: "ink", className: "bg-ink", hex: "#2B2A26" },
  { name: "forest", className: "bg-forest", hex: "#2F4A3A" },
  { name: "brown", className: "bg-brown", hex: "#8A5A3B" },
  { name: "muted", className: "bg-muted", hex: "#6E685D" },
  { name: "line", className: "bg-line", hex: "#DDD4C3" },
  { name: "card", className: "bg-card", hex: "#FFFDF8" },
  { name: "sand", className: "bg-sand", hex: "#EFE8DA" },
  { name: "sage", className: "bg-sage", hex: "#A8B89A" },
  { name: "sage-soft", className: "bg-sage-soft", hex: "#E4EADC" },
  { name: "danger", className: "bg-danger", hex: "#8B2A1E" },
];

export default function StyleguidePage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <PageShell eyebrow="Design system" title="Rootline style guide" description="Tokens from tailwind.config.mts and components from src/ui.">
      <div className="flex flex-col gap-10">
        <section className="flex flex-col gap-4">
          <h2 className="text-2xl">Colours</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {COLOURS.map((colour) => (
              <div key={colour.name} className="flex flex-col gap-2">
                <div className={`h-16 rounded border border-line ${colour.className}`} />
                <p className="text-sm">
                  {colour.name} <span className="text-muted">{colour.hex}</span>
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3">
          <h2 className="text-2xl">Type</h2>
          <p className="font-serif text-4xl">Hazy Pale Ale, batch 214</p>
          <p className="max-w-prose">
            Body text is Inter. Brewed in Port Moody with barley from Kowalski Farm in Armstrong and hops from Singh Hop
            Farm in Lillooet.
          </p>
          <p className="text-sm text-muted">Canned 9 days ago</p>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl">Buttons and badges</h2>
          <div className="flex flex-wrap gap-3">
            <Button>New batch</Button>
            <Button variant="secondary">Download PNG</Button>
            <Button variant="ghost">Cancel</Button>
            <Button variant="danger">Send recall</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge tone="verified">B Corp</Badge>
            <Badge tone="live">Live</Badge>
            <Badge tone="draft">Draft</Badge>
            <Badge tone="neutral">Sold out</Badge>
            <Badge tone="warning">Expires in 12 days</Badge>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-2xl">Tables and navigation</h2>
          <Table caption="Sample batches">
            <thead>
              <tr>
                <Th>Brew</Th>
                <Th>Status</Th>
                <Th className="text-right">Scans</Th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <Td className="font-medium">Hazy Pale Ale, Brew 214</Td>
                <Td>
                  <Badge tone="live">Live</Badge>
                </Td>
                <Td className="text-right">342</Td>
              </tr>
              <tr>
                <Td className="font-medium">Hazy Pale Ale, Brew 213</Td>
                <Td>
                  <Badge tone="neutral">Sold out</Badge>
                </Td>
                <Td className="text-right">812</Td>
              </tr>
            </tbody>
          </Table>
          <div className="flex max-w-xs flex-col gap-1 rounded bg-sand p-3 text-sm">
            <span className="flex min-h-11 items-center gap-3 rounded bg-sage-soft px-3 font-medium text-forest">
              <LineIcon name="grid" className="h-5 w-5" /> Current page
            </span>
            <span className="flex min-h-11 items-center gap-3 px-3">
              <LineIcon name="box" className="h-5 w-5" /> Other page
            </span>
          </div>
        </section>

        <section className="grid gap-6 sm:grid-cols-2">
          <Card>
            <h2 className="mb-4 text-xl">Form fields</h2>
            <form className="flex flex-col gap-4">
              <Field id="sg-name" label="Product name" hint="As it appears on the can.">
                <Input id="sg-name" placeholder="Hazy Pale Ale" />
              </Field>
              <Field id="sg-industry" label="What do you make?">
                <Select
                  id="sg-industry"
                  placeholder="Choose one"
                  options={[
                    { value: "brewery", label: "Brewery" },
                    { value: "bakery", label: "Bakery" },
                  ]}
                />
              </Field>
              <Field id="sg-note" label="Note" error="Please keep notes under 200 characters.">
                <Textarea id="sg-note" invalid rows={2} />
              </Field>
            </form>
          </Card>
          <Card>
            <h2 className="mb-4 text-xl">Stepper</h2>
            <Stepper steps={["Product & dates", "Lots", "Print"]} current={1} />
          </Card>
        </section>
      </div>
    </PageShell>
  );
}
