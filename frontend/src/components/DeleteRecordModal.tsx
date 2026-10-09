"use client";

import {
  Box,
  Button,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";
import type { DnsRecord } from "@/lib/types";

type Props = {
  records: DnsRecord[];
  skipped: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteRecordModal({
  records,
  skipped,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const shown = records.slice(0, 5);
  const more = records.length - shown.length;
  const many = records.length > 1;

  return (
    <Modal
      visible
      onDismiss={onClose}
      header={many ? `Delete ${records.length} records` : "Delete record"}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" loading={loading} onClick={onConfirm}>
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="s">
        <Box>
          {many
            ? "These records will be permanently deleted:"
            : "This record will be permanently deleted:"}
        </Box>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {shown.map((r) => (
            <li key={r.id}>
              <strong>{r.name}</strong> ({r.type})
            </li>
          ))}
          {more > 0 ? <li>and {more} more</li> : null}
        </ul>
        {skipped > 0 ? (
          <Box color="text-status-inactive">
            {skipped} selected record{skipped > 1 ? "s" : ""} (the default NS
            and SOA) can&apos;t be deleted and will be skipped.
          </Box>
        ) : null}
      </SpaceBetween>
    </Modal>
  );
}
