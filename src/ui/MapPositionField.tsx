"use client";
// "Map position" input that can be filled from the address.
//  - When the address box loses focus and the position is still empty, it
//    looks the address up and fills in a suggestion.
//  - "Find on map" looks it up again on demand.
// The producer always sees what was found, with a link to check it, because
// an address search can pick the wrong place. Without JavaScript it is a
// plain text box for "latitude, longitude".
import { useEffect, useRef, useState } from "react";
import { findCoordinates } from "@/lib/geocode-action";
import { Button } from "./Button";
import { Field, Input } from "./Field";

type MapPositionFieldProps = {
  id: string;
  name: string;
  /** id of the address input this position belongs to. */
  addressInputId: string;
  defaultValue?: string;
  label?: string;
  required?: boolean;
  error?: string;
};

type LookupState =
  | { kind: "idle" }
  | { kind: "busy" }
  | { kind: "found"; placeName: string; mapUrl: string }
  | { kind: "problem"; message: string };

export function MapPositionField({ id, name, addressInputId, defaultValue = "", label = "Map position", required, error }: MapPositionFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lookup, setLookup] = useState<LookupState>({ kind: "idle" });

  /** `automatic`: a suggestion after typing the address; it never replaces a typed position. */
  async function findFromAddress(automatic = false) {
    const address = (document.getElementById(addressInputId) as HTMLInputElement | null)?.value.trim() ?? "";
    if (address.length < 3) {
      if (!automatic) setLookup({ kind: "problem", message: "Type the address first." });
      return;
    }
    setLookup({ kind: "busy" });
    const result = await findCoordinates({ address });
    if (!result.ok) {
      setLookup({ kind: "problem", message: result.error.message });
      return;
    }
    const input = inputRef.current;
    if (!input) return;
    // The producer may have typed a position while the lookup was running.
    if (automatic && input.value.trim()) {
      setLookup({ kind: "idle" });
      return;
    }
    input.value = result.data.coordinates;
    setLookup({ kind: "found", placeName: result.data.placeName, mapUrl: result.data.mapUrl });
  }

  // Suggest a position as soon as an address is typed, but never overwrite one.
  useEffect(() => {
    const address = document.getElementById(addressInputId);
    const suggest = () => {
      if (!inputRef.current?.value.trim()) void findFromAddress(true);
    };
    address?.addEventListener("blur", suggest);
    return () => address?.removeEventListener("blur", suggest);
  });

  return (
    <Field id={id} label={label} hint="Latitude, longitude. Filled in from the address; check it, or paste your own." error={error}>
      <div className="flex gap-2">
        <Input ref={inputRef} id={id} name={name} defaultValue={defaultValue} placeholder="50.4148, -119.1937" required={required} invalid={!!error} />
        <Button variant="secondary" onClick={() => findFromAddress()} disabled={lookup.kind === "busy"} className="shrink-0">
          {lookup.kind === "busy" ? "Finding…" : "Find on map"}
        </Button>
      </div>
      <p aria-live="polite" className="text-sm">
        {lookup.kind === "found" && (
          <span className="text-forest">
            Found: {lookup.placeName}.{" "}
            <a href={lookup.mapUrl} target="_blank" rel="noreferrer">
              Check on the map
            </a>{" "}
            <span className="text-muted">(© OpenStreetMap contributors)</span>
          </span>
        )}
        {lookup.kind === "problem" && <span className="text-danger">{lookup.message}</span>}
      </p>
    </Field>
  );
}
