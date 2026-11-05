"use client";
import type { ReportStatus } from "@prisma/client";
import { setReportStatus } from "@/lib/admin/actions";
import { ActionForm, SubmitButton } from "./action-form";

export function ReportActions({ id, status }: { id: number; status: ReportStatus }) {
  const unresolved = status === "open" || status === "rechecking";
  return (
    <ActionForm action={setReportStatus} className="flex flex-wrap items-center gap-2" messageClassName="basis-full">
      <input type="hidden" name="id" value={id} />
      {status === "open" ? (
        <SubmitButton variant="primary" name="status" value="rechecking">
          Recheck
        </SubmitButton>
      ) : null}
      {unresolved ? (
        <>
          <SubmitButton name="status" value="fixed">
            Fixed
          </SubmitButton>
          <SubmitButton variant="ghost" name="status" value="rejected">
            Reject
          </SubmitButton>
        </>
      ) : (
        <SubmitButton variant="ghost" name="status" value="rechecking">
          Reopen
        </SubmitButton>
      )}
    </ActionForm>
  );
}
