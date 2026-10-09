"use client";

import { useState } from "react";
import {
  Button,
  Container,
  Form,
  FormField,
  Header,
  Input,
  Select,
  SpaceBetween,
  Textarea,
} from "@cloudscape-design/components";
import type { DnsRecord, Zone } from "@/lib/types";

const TYPES = ["A", "AAAA", "CAA", "CNAME", "MX", "NS", "PTR", "SRV", "TXT"];

const HINTS: Record<string, { placeholder: string; help: string }> = {
  A: {
    placeholder: "192.0.2.235",
    help: "An IPv4 address. Enter multiple values on separate lines.",
  },
  AAAA: {
    placeholder: "2001:db8::1",
    help: "An IPv6 address. Enter multiple values on separate lines.",
  },
  CNAME: {
    placeholder: "www.example.com",
    help: "One domain name. A CNAME cannot share a name with other records.",
  },
  MX: {
    placeholder: "10 mail.example.com",
    help: "Priority, then mail server. One per line.",
  },
  TXT: {
    placeholder: '"v=spf1 include:example.com ~all"',
    help: "Text, usually wrapped in double quotes. One per line.",
  },
  NS: {
    placeholder: "ns-1.example.com",
    help: "Name server domain names. One per line.",
  },
  PTR: {
    placeholder: "host.example.com",
    help: "A domain name. One per line.",
  },
  SRV: {
    placeholder: "10 5 443 server.example.com",
    help: "Priority, weight, port, then target. One per line.",
  },
  CAA: {
    placeholder: '0 issue "letsencrypt.org"',
    help: "Flags, tag (issue, issuewild, iodef), then value in double quotes. One per line.",
  },
};

export type RecordFormValues = {
  name: string;
  type: string;
  ttl: number;
  values: string[];
};

type Props = {
  zone: Zone;
  initial?: DnsRecord;
  submitting: boolean;
  error: string;
  onSubmit: (v: RecordFormValues) => void;
  onCancel: () => void;
};

export default function RecordForm({
  zone,
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const editing = !!initial;

  const [name, setName] = useState("");
  const [type, setType] = useState(initial?.type ?? "A");
  const [ttl, setTtl] = useState(String(initial?.ttl ?? 300));
  const [valuesText, setValuesText] = useState(
    initial ? initial.values.join("\n") : "",
  );
  const [localError, setLocalError] = useState("");

  const hint = HINTS[type] ?? { placeholder: "", help: "" };
  const fullName = editing
    ? initial.name
    : name.trim() === ""
      ? zone.name
      : `${name.trim().toLowerCase()}.${zone.name}`;

  const submit = () => {
    setLocalError("");
    const values = valuesText
      .split("\n")
      .map((v) => v.trim())
      .filter(Boolean);
    const ttlNumber = Number(ttl);

    if (values.length === 0) return setLocalError("Enter at least one value.");
    if (!Number.isInteger(ttlNumber) || ttlNumber < 0) {
      return setLocalError(
        "TTL must be a whole number of seconds (0 or more).",
      );
    }
    onSubmit({ name, type, ttl: ttlNumber, values });
  };

  return (
    <Form
      errorText={localError || error}
      actions={
        <SpaceBetween direction="horizontal" size="xs">
          <Button variant="link" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" loading={submitting} onClick={submit}>
            {editing ? "Save" : "Create record"}
          </Button>
        </SpaceBetween>
      }
    >
      <Container header={<Header variant="h2">Record details</Header>}>
        <SpaceBetween size="l">
          <FormField
            label="Record name"
            description="Leave blank to create a record for the domain itself."
            constraintText={`Full name: ${fullName}`}
          >
            <Input
              value={editing ? initial.name : name}
              disabled={editing}
              placeholder="www"
              onChange={({ detail }) => setName(detail.value)}
            />
          </FormField>

          <FormField label="Record type">
            {editing ? (
              <Input value={type} disabled />
            ) : (
              <Select
                selectedOption={{ label: type, value: type }}
                options={TYPES.map((t) => ({ label: t, value: t }))}
                onChange={({ detail }) =>
                  setType(detail.selectedOption.value ?? "A")
                }
              />
            )}
          </FormField>

          <FormField label="Value" description={hint.help}>
            <Textarea
              rows={4}
              value={valuesText}
              placeholder={hint.placeholder}
              onChange={({ detail }) => setValuesText(detail.value)}
            />
          </FormField>

          <FormField
            label="TTL (seconds)"
            constraintText="Recommended: 60 to 172800 (two days)"
          >
            <Input
              type="number"
              value={ttl}
              onChange={({ detail }) => setTtl(detail.value)}
            />
          </FormField>

          <FormField label="Routing policy">
            <Input value="Simple routing" disabled />
          </FormField>
        </SpaceBetween>
      </Container>
    </Form>
  );
}
