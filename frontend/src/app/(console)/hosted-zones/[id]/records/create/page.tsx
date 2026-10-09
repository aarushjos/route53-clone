"use client";

import { useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  ExpandableSection,
  Form,
  Header,
  SpaceBetween,
  Spinner,
  Tiles,
} from "@cloudscape-design/components";
import RecordFields, {
  RecordDraft,
  newDraft,
  parseDraft,
} from "@/components/RecordFields";
import { useNotifications } from "@/lib/notifications";
import { useCreateRecords } from "@/lib/records";
import { useZone } from "@/lib/zones";

export default function CreateRecordPage() {
  const params = useParams<{ id: string }>();
  const zoneId = Number(params.id);
  const router = useRouter();
  const { notify } = useNotifications();

  const { data: zone, isLoading, error: zoneError } = useZone(zoneId);
  const createRecords = useCreateRecords(zoneId);

  const nextKey = useRef(1);
  const [drafts, setDrafts] = useState<RecordDraft[]>([newDraft(0)]);
  const [error, setError] = useState("");

  if (isLoading) return <Spinner size="large" />;
  if (zoneError || !zone)
    return <Alert type="error">Hosted zone not found.</Alert>;

  const patch = (key: number, p: Partial<RecordDraft>) =>
    setDrafts((ds) => ds.map((d) => (d.key === key ? { ...d, ...p } : d)));
  const add = () => setDrafts((ds) => [...ds, newDraft(nextKey.current++)]);
  const remove = (key: number) =>
    setDrafts((ds) => ds.filter((d) => d.key !== key));

  const submit = async () => {
    setError("");
    const payload: {
      name: string;
      type: string;
      ttl: number;
      values: string[];
    }[] = [];

    for (let i = 0; i < drafts.length; i++) {
      const d = drafts[i];
      const parsed = parseDraft(d);
      if (!parsed.ok) {
        return setError(
          drafts.length > 1 ? `Record ${i + 1}: ${parsed.error}` : parsed.error,
        );
      }
      payload.push({
        name: d.name,
        type: d.type,
        ttl: parsed.ttl,
        values: parsed.values,
      });
    }

    try {
      const created = await createRecords.mutateAsync(payload);
      notify(
        "success",
        created.length === 1
          ? `Record ${created[0].name} (${created[0].type}) was successfully created.`
          : `${created.length} records were successfully created.`,
      );
      router.push(`/hosted-zones/${zoneId}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not create the records",
      );
    }
  };

  return (
    <SpaceBetween size="l">
      <ExpandableSection
        variant="container"
        headerText="Record creation method"
        defaultExpanded
      >
        <Tiles
          value="quick"
          columns={2}
          onChange={() => {}}
          items={[
            {
              value: "quick",
              label: "Quick create (recommended for expert users)",
              description:
                "Choose this method if you are confident in the process of creating records and know which options you need.",
            },
            {
              value: "wizard",
              label: "Wizard (recommended for new users)",
              description:
                "Choose this method if you need more explanations as you create your record.",
              disabled: true,
            },
          ]}
        />
      </ExpandableSection>

      <Header variant="h1">Create record</Header>

      <Form
        errorText={error}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              onClick={() => router.push(`/hosted-zones/${zoneId}`)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={createRecords.isPending}
              onClick={submit}
            >
              Create records
            </Button>
          </SpaceBetween>
        }
      >
        <Container
          header={<Header variant="h2">Quick create record</Header>}
          footer={
            <Box float="right">
              <Button onClick={add}>Add another record</Button>
            </Box>
          }
        >
          <SpaceBetween size="xl">
            {drafts.map((d, i) => (
              <SpaceBetween key={d.key} size="m">
                <Header
                  variant="h3"
                  actions={
                    <Button
                      disabled={drafts.length === 1}
                      onClick={() => remove(d.key)}
                    >
                      Delete
                    </Button>
                  }
                >
                  Record {i + 1}
                </Header>
                <RecordFields
                  zone={zone}
                  draft={d}
                  onChange={(p) => patch(d.key, p)}
                />
              </SpaceBetween>
            ))}
          </SpaceBetween>
        </Container>
      </Form>
    </SpaceBetween>
  );
}
