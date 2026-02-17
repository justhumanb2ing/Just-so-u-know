import { CircleAlertIcon, CircleCheckIcon, LoaderIcon } from "lucide-react";
import type { UseHandleAvailabilityResult } from "@/components/onboarding/use-handle-availability";
import { Field, FieldContent, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { HANDLE_MAX_LENGTH, HANDLE_MIN_LENGTH } from "@/service/onboarding/schema";
import { SITE_DEFAULT_DESCRIPTION, SITE_URL } from "@/config/seo/site";

type HandleInputFieldProps = {
  handleInput: UseHandleAvailabilityResult["handleInput"];
  handleCheckState: UseHandleAvailabilityResult["handleCheckState"];
  onHandleChange: UseHandleAvailabilityResult["onHandleChange"];
};

type HandleStatusIconProps = {
  status: UseHandleAvailabilityResult["handleCheckState"]["status"];
};

function HandleStatusIcon({ status }: HandleStatusIconProps) {
  if (status === "checking") {
    return <LoaderIcon className="animate-spin text-muted-foreground text-sm" />;
  }

  if (status === "available") {
    return <CircleCheckIcon className="fill-green-500 stroke-white text-sm" />;
  }

  if (status === "error" || status === "taken" || status === "invalid") {
    return <CircleAlertIcon className="fill-destructive stroke-white text-sm" />;
  }

  return null;
}

/**
 * handle 입력과 상태 표시 UI를 합성 컴포넌트로 분리한다.
 */
export function HandleInputField({ handleInput, handleCheckState, onHandleChange }: HandleInputFieldProps) {
  return (
    <FieldGroup>
      <FieldSet className="gap-2">
        <Field className="gap-0 *:not-first:mt-2">
          <FieldLabel htmlFor="handle" className="sr-only">
            Handle
          </FieldLabel>
          <FieldContent className="relative">
            <Input
              id="handle"
              name="handle"
              placeholder="handle"
              value={handleInput}
              minLength={HANDLE_MIN_LENGTH}
              maxLength={HANDLE_MAX_LENGTH}
              autoComplete="off"
              onChange={(event) => onHandleChange(event.target.value)}
              aria-invalid={handleCheckState.status === "invalid" || handleCheckState.status === "taken"}
              required
              className="peer rounded-lg border-none bg-muted py-6 ps-40 text-base! shadow-none"
            />
            <span className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-base text-muted-foreground peer-disabled:opacity-50">
              justsouknow.me/@
            </span>
            <span className="pointer-events-none absolute inset-y-0 end-0 flex items-center justify-center pe-3 peer-disabled:opacity-50">
              <HandleStatusIcon status={handleCheckState.status} />
            </span>
          </FieldContent>
        </Field>
      </FieldSet>
    </FieldGroup>
  );
}
