// Wrapper used by every server action. In one place it:
//  1. gets the requestId, 2. validates input with the action's Zod schema,
//  3. logs start / success / failure with duration, 4. turns errors into a
//  typed Result so raw errors never reach the browser, 5. reports bugs to Sentry.
//
// The returned function accepts a plain object, a FormData, or
// (previousState, FormData) — so it can be passed straight to <form action>
// or React's useActionState, and forms work before JavaScript loads.
import "server-only";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { requireOwnerForAction, type Owner } from "./auth";
import { ValidationError, isAppError } from "./errors";
import { formDataToObject } from "./form";
import { logger } from "./logger";
import { getRequestId } from "./request-context";
import { fail, ok, type Result } from "./result";
import { reportError } from "./sentry";

export type ActionContext = {
  requestId: string;
  brandId?: string;
  /** Call once the brand is known, so later log lines and Sentry tags include it. */
  setBrandId: (brandId: string) => void;
};

type ActionDefinition<Schema extends z.ZodType, Output, Ctx> = {
  feature: string;
  action: string;
  input: Schema;
  handler: (input: z.output<Schema>, ctx: Ctx) => Promise<Output>;
};

export type ServerAction<Input, Output> = {
  (input: Input | FormData): Promise<Result<Output>>;
  (previousState: unknown, form: FormData): Promise<Result<Output>>;
};

function pickInput(first: unknown, second: unknown): unknown {
  const raw = second instanceof FormData ? second : first;
  return raw instanceof FormData ? formDataToObject(raw) : raw;
}

export function defineAction<Schema extends z.ZodType, Output>(
  definition: ActionDefinition<Schema, Output, ActionContext>,
): ServerAction<z.input<Schema>, Output> {
  const { feature, action, input, handler } = definition;

  return async (first: unknown, second?: unknown) => {
    const ctx: ActionContext = {
      requestId: await getRequestId(),
      setBrandId(brandId) {
        ctx.brandId = brandId;
      },
    };
    const started = performance.now();
    const logFields = () => ({
      feature,
      action,
      requestId: ctx.requestId,
      brandId: ctx.brandId,
      durationMs: Math.round(performance.now() - started),
    });

    logger.info("action started", logFields());

    const parsed = input.safeParse(pickInput(first, second));
    if (!parsed.success) {
      const fieldErrors = toFieldErrors(parsed.error);
      logger.warn("action failed", { ...logFields(), code: "VALIDATION_FAILED", fieldErrors });
      return fail("VALIDATION_FAILED", ctx.requestId, undefined, fieldErrors);
    }

    try {
      const data = await handler(parsed.data, ctx);
      logger.info("action succeeded", logFields());
      return ok(data);
    } catch (error) {
      // redirect() and notFound() work by throwing; let Next.js handle them.
      unstable_rethrow(error);

      if (error instanceof ValidationError) {
        logger.warn("action failed", { ...logFields(), code: error.code, fieldErrors: error.fieldErrors });
        return fail(error.code, ctx.requestId, error.message, error.fieldErrors);
      }

      if (isAppError(error)) {
        logger.warn("action failed", { ...logFields(), code: error.code, reason: error.message });
        return fail(error.code, ctx.requestId, error.message);
      }

      logger.error("action crashed", { ...logFields(), code: "INTERNAL_ERROR", error });
      reportError(error, { feature, action, requestId: ctx.requestId, brandId: ctx.brandId });
      return fail("INTERNAL_ERROR", ctx.requestId);
    }
  };
}

/** Same as defineAction, for logged-in producers: the handler also gets `ctx.owner`. */
export function defineOwnerAction<Schema extends z.ZodType, Output>(
  definition: ActionDefinition<Schema, Output, ActionContext & { owner: Owner }>,
): ServerAction<z.input<Schema>, Output> {
  return defineAction({
    ...definition,
    handler: async (input, ctx) => {
      const owner = await requireOwnerForAction();
      ctx.setBrandId(owner.brandId);
      return definition.handler(input, { ...ctx, owner });
    },
  });
}

/** Zod issues -> { fieldName: [messages] }, for showing next to form fields. */
export function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  const result: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    (result[key] ??= []).push(issue.message);
  }
  return result;
}
