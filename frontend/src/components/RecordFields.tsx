"use client";

import {
  Button,
  ColumnLayout,
  FormField,
  Input,
  Select,
  SpaceBetween,
  Textarea,
  Toggle,
} from "@cloudscape-design/components";
import type { Zone } from "@/lib/types";

export type RecordDraft = {
  key: number;
  name: string;
  type: string;
  ttl: string;
  valuesText: string;
};

export const newDraft = (
  key: number,
  init: Partial<RecordDraft> = {},
): RecordDraft => ({
  key,
  name: "",
  type: "A",
  ttl: "300",
  valuesText: "",
  ...init,
});

const TYPES = [
  {
    value: "A",
    label: "A – Routes traffic to an IPv4 address and some AWS resources",
  },
  {
    value: "AAAA",
    label: "AAAA – Routes traffic to an IPv6 address and some AWS resources",
  },
  {
    value: "CAA",
    label:
      "CAA – Restricts CAs that can create SSL/TLS certifications for the domain",
  },
  {
    value: "CNAME",
    label:
      "CNAME – Routes traffic to another domain name and to some AWS resources",
  },
  { value: "MX", label: "MX – Routes traffic to mail servers" },
  { value: "NS", label: "NS – Delegates a subdomain to other name servers" },
  { value: "PTR", label: "PTR – Maps an IP address to a domain name" },
  {
    value: "SRV",
    label: "SRV – Application-specific values that identify servers",
  },
  {
    value: "TXT",
    label:
      "TXT – Used to verify email senders and for application-specific values",
  },
];

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

export function parseDraft(
  d: RecordDraft,
): { ok: true; ttl: number; values: string[] } | { ok: false; error: string } {
  const values = d.valuesText
    .split("\n")
    .map((v) => v.trim())
    .filter(Boolean);
  if (values.length === 0)
    return { ok: false, error: "Enter at least one value." };

  const ttl = Number(d.ttl);
  if (
    d.ttl.trim() === "" ||
    !Number.isInteger(ttl) ||
    ttl < 0 ||
    ttl > 2147483647
  ) {
    return {
      ok: false,
      error: "TTL must be a whole number of seconds (0 or more).",
    };
  }
  return { ok: true, ttl, values };
}

type Props = {
  zone: Zone;
  draft: RecordDraft;
  onChange: (patch: Partial<RecordDraft>) => void;
  locked?: boolean;
  lockedName?: string;
};

export default function RecordFields({
  zone,
  draft,
  onChange,
  locked,
  lockedName,
}: Props) {
  const hint = HINTS[draft.type] ?? { placeholder: "", help: "" };
  const typeOption = TYPES.find((t) => t.value === draft.type) ?? TYPES[0];

  return (
    <SpaceBetween size="l">
      <ColumnLayout columns={2}>
        <FormField
          label="Record name"
          constraintText={
            locked
              ? undefined
              : "Keep blank to create a record for the root domain."
          }
        >
          {locked ? (
            <Input value={lockedName ?? ""} disabled />
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <Input
                  value={draft.name}
                  placeholder="subdomain"
                  onChange={({ detail }) => onChange({ name: detail.value })}
                />
              </div>
              <span>{zone.name}</span>
            </div>
          )}
        </FormField>

        <FormField label="Record type">
          <Select
            selectedOption={typeOption}
            options={TYPES}
            disabled={locked}
            onChange={({ detail }) =>
              onChange({ type: detail.selectedOption.value ?? "A" })
            }
          />
        </FormField>
      </ColumnLayout>

      <Toggle
        checked={false}
        disabled
        onChange={() => {}}
        description="Alias records aren't available in this demo."
      >
        Alias
      </Toggle>

      <FormField label="Value" constraintText={hint.help}>
        <Textarea
          rows={4}
          value={draft.valuesText}
          placeholder={hint.placeholder}
          onChange={({ detail }) => onChange({ valuesText: detail.value })}
        />
      </FormField>

      <ColumnLayout columns={2}>
        <FormField
          label="TTL (seconds)"
          constraintText="Recommended values: 60 to 172800 (two days)"
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                type="number"
                value={draft.ttl}
                onChange={({ detail }) => onChange({ ttl: detail.value })}
              />
            </div>
            <Button onClick={() => onChange({ ttl: "60" })}>1m</Button>
            <Button onClick={() => onChange({ ttl: "3600" })}>1h</Button>
            <Button onClick={() => onChange({ ttl: "86400" })}>1d</Button>
          </div>
        </FormField>

        <FormField label="Routing policy">
          <Select
            selectedOption={{ label: "Simple routing", value: "simple" }}
            options={[{ label: "Simple routing", value: "simple" }]}
            onChange={() => {}}
          />
        </FormField>
      </ColumnLayout>
    </SpaceBetween>
  );
}
