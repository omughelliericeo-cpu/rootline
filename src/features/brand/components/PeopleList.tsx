"use client";
// "Meet the maker": the people behind the brand. Each person can be edited or
// removed in place; a form at the bottom adds someone new.
import { fieldError, type Result } from "@/lib/result";
import { ACCEPTED_IMAGE_TYPES } from "@/lib/storage-rules";
import { Card, Field, FormStatus, Input, Photo, SubmitButton } from "@/ui";
import { useFormAction } from "@/ui/useFormAction";
import { addPerson, removePerson, updatePerson } from "../server/people-actions";
import type { BrandPersonView } from "../server/queries";

export function PeopleList({ people, makerLabel }: { people: BrandPersonView[]; makerLabel: string }) {
  return (
    <Card>
      <h2 className="mb-1 text-xl">People</h2>
      <p className="mb-5 text-sm text-muted">
        Shown under “Meet the maker”. Add a portrait, a name and a role, e.g. Head {makerLabel.toLowerCase()}.
      </p>
      <ul className="mb-8 flex flex-col gap-6">
        {people.map((person) => (
          <li key={person.id} className="border-b border-line pb-6 last:border-0">
            <PersonEditor person={person} />
          </li>
        ))}
      </ul>
      <AddPersonForm />
    </Card>
  );
}

function PersonFields({ idPrefix, result, person }: { idPrefix: string; result: Result<unknown> | null; person?: BrandPersonView }) {
  const error = (field: string) => fieldError(result, field);
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field id={`${idPrefix}-name`} label="Name" error={error("name")}>
        <Input id={`${idPrefix}-name`} name="name" defaultValue={person?.name} maxLength={80} required invalid={!!error("name")} />
      </Field>
      <Field id={`${idPrefix}-role`} label="Role" error={error("role")}>
        <Input id={`${idPrefix}-role`} name="role" defaultValue={person?.role} maxLength={80} required invalid={!!error("role")} />
      </Field>
      <div className="sm:col-span-2">
        <Field id={`${idPrefix}-photo`} label={person?.photoUrl ? "Replace portrait (optional)" : "Portrait (optional)"}>
          <Input id={`${idPrefix}-photo`} name="photo" type="file" accept={ACCEPTED_IMAGE_TYPES} />
        </Field>
      </div>
    </div>
  );
}

function PersonEditor({ person }: { person: BrandPersonView }) {
  const { result: updateResult, pending: updateActionPending, formProps: updateActionProps } = useFormAction(updatePerson);
  const { result: removeResult, pending: removeActionPending, formProps: removeActionProps } = useFormAction(removePerson);
  const idPrefix = `person-${person.id}`;

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="w-24 shrink-0">
        {person.photoUrl ? (
          <Photo src={person.photoUrl} alt={`Portrait of ${person.name}`} aspect="portrait" sizes="96px" />
        ) : (
          <div className="flex aspect-[4/5] items-center justify-center rounded bg-line text-xs text-muted">No photo</div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3">
        <form {...updateActionProps} className="flex flex-col gap-4">
          <input type="hidden" name="personId" value={person.id} />
          <PersonFields idPrefix={idPrefix} result={updateResult} person={person} />
          <div className="flex flex-wrap items-center gap-3">
            <SubmitButton pending={updateActionPending} variant="secondary">Save {person.name}</SubmitButton>
            <FormStatus result={updateResult} />
          </div>
        </form>
        <form {...removeActionProps} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="personId" value={person.id} />
          <SubmitButton pending={removeActionPending} variant="ghost" pendingLabel="Removing…">
            Remove {person.name}
          </SubmitButton>
          <FormStatus result={removeResult} />
        </form>
      </div>
    </div>
  );
}

function AddPersonForm() {
  const { result, pending: actionPending, formProps: actionProps } = useFormAction(addPerson, { resetOnSuccess: true });
  return (
    <form {...actionProps} className="flex flex-col gap-4 rounded border border-dashed border-line p-4 sm:p-5">
      <h3 className="text-lg">Add a person</h3>
      <PersonFields idPrefix="new-person" result={result} />
      <div className="flex flex-wrap items-center gap-3">
        <SubmitButton pending={actionPending} pendingLabel="Adding…">Add person</SubmitButton>
        <FormStatus result={result} />
      </div>
    </form>
  );
}
