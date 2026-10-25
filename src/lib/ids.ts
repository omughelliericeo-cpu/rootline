// Id checks. URLs like /suppliers/{id} carry user-typed ids; checking the
// shape first avoids a database error for "/suppliers/not-a-uuid".
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID.test(value);
}
