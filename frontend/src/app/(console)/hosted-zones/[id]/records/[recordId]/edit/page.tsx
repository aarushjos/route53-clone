"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  ContentLayout,
  Header,
  Spinner,
} from "@cloudscape-design/components";
import RecordForm, { RecordFormValues } from "@/components/RecordForm";
import { useNotifications } from "@/lib/notifications";
import { useRecord, useUpdateRecord } from "@/lib/records";
import { useZone } from "@/lib/zones";

export default function EditRecordPage() {
  const params = useParams<{ id: string; recordId: string }>();
  const zoneId = Number(params.id);
  const recordId = Number(params.recordId);
  const router = useRouter();
  const { notify } = useNotifications();

  const { data: zone, isLoading: zoneLoading } = useZone(zoneId);
  const {
    data: record,
    isLoading: recordLoading,
    error: recordError,
  } = useRecord(zoneId, recordId);
  const updateRecord = useUpdateRecord(zoneId, recordId);
  const [error, setError] = useState("");

  if (zoneLoading || recordLoading) return <Spinner size="large" />;
  if (!zone || recordError || !record)
    return <Alert type="error">Record not found.</Alert>;
  if (record.type === "SOA")
    return <Alert type="warning">The SOA record cannot be edited.</Alert>;

  const submit = async (v: RecordFormValues) => {
    setError("");
    try {
      await updateRecord.mutateAsync({ ttl: v.ttl, values: v.values });
      notify(
        "success",
        `Record ${record.name} (${record.type}) was successfully updated.`,
      );
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update the record",
      );
    }
  };

  return (
    <ContentLayout header={<Header variant="h1">Edit record</Header>}>
      <RecordForm
        zone={zone}
        initial={record}
        submitting={updateRecord.isPending}
        error={error}
        onSubmit={submit}
        onCancel={() => router.push(`/hosted-zones/${zoneId}`)}
      />
    </ContentLayout>
  );
}
