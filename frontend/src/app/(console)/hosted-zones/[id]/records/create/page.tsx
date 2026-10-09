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
import { useCreateRecord } from "@/lib/records";
import { useZone } from "@/lib/zones";

export default function CreateRecordPage() {
  const params = useParams<{ id: string }>();
  const zoneId = Number(params.id);
  const router = useRouter();
  const { notify } = useNotifications();

  const { data: zone, isLoading, error: zoneError } = useZone(zoneId);
  const createRecord = useCreateRecord(zoneId);
  const [error, setError] = useState("");

  if (isLoading) return <Spinner size="large" />;
  if (zoneError || !zone)
    return <Alert type="error">Hosted zone not found.</Alert>;

  const submit = async (v: RecordFormValues) => {
    setError("");
    try {
      const rec = await createRecord.mutateAsync(v);
      notify(
        "success",
        `Record ${rec.name} (${rec.type}) was successfully created.`,
      );
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the record",
      );
    }
  };

  return (
    <ContentLayout header={<Header variant="h1">Create record</Header>}>
      <RecordForm
        zone={zone}
        submitting={createRecord.isPending}
        error={error}
        onSubmit={submit}
        onCancel={() => router.push(`/hosted-zones/${zoneId}`)}
      />
    </ContentLayout>
  );
}
