"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Button,
  Container,
  ContentLayout,
  Form,
  Header,
  SpaceBetween,
  Spinner,
} from "@cloudscape-design/components";
import RecordFields, { newDraft, parseDraft } from "@/components/RecordFields";
import { useNotifications } from "@/lib/notifications";
import { useRecord, useUpdateRecord } from "@/lib/records";
import type { DnsRecord, Zone } from "@/lib/types";
import { useZone } from "@/lib/zones";

function EditForm({ zone, record }: { zone: Zone; record: DnsRecord }) {
  const router = useRouter();
  const { notify } = useNotifications();
  const update = useUpdateRecord(zone.id, record.id);

  const [draft, setDraft] = useState(() =>
    newDraft(0, {
      type: record.type,
      ttl: String(record.ttl),
      valuesText: record.values.join("\n"),
    }),
  );
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    const parsed = parseDraft(draft);
    if (!parsed.ok) return setError(parsed.error);
    try {
      await update.mutateAsync({ ttl: parsed.ttl, values: parsed.values });
      notify(
        "success",
        `Record ${record.name} (${record.type}) was successfully updated.`,
      );
      router.push(`/hosted-zones/${zone.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not update the record",
      );
    }
  };

  return (
    <ContentLayout header={<Header variant="h1">Edit record</Header>}>
      <Form
        errorText={error}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => router.push(`/hosted-zones/${zone.id}`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={update.isPending}
              onClick={submit}
            >
              Save
            </Button>
          </SpaceBetween>
        }
      >
        <Container header={<Header variant="h2">Record details</Header>}>
          <RecordFields
            zone={zone}
            draft={draft}
            locked
            lockedName={record.name}
            onChange={(p) => setDraft((d) => ({ ...d, ...p }))}
          />
        </Container>
      </Form>
    </ContentLayout>
  );
}

export default function EditRecordPage() {
  const params = useParams<{ id: string; recordId: string }>();
  const zoneId = Number(params.id);
  const recordId = Number(params.recordId);

  const { data: zone, isLoading: zoneLoading } = useZone(zoneId);
  const {
    data: record,
    isLoading: recordLoading,
    error: recordError,
  } = useRecord(zoneId, recordId);

  if (zoneLoading || recordLoading) return <Spinner size="large" />;
  if (!zone || recordError || !record)
    return <Alert type="error">Record not found.</Alert>;
  if (record.type === "SOA")
    return <Alert type="warning">The SOA record cannot be edited.</Alert>;

  return <EditForm zone={zone} record={record} />;
}
