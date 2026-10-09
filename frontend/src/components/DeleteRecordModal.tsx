"use client";

import {
  Box,
  Button,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";
import type { DnsRecord } from "@/lib/types";

type Props = {
  record: DnsRecord;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteRecordModal({
  record,
  loading,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      visible
      onDismiss={onClose}
      header="Delete record"
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
      Are you sure you want to delete the <strong>{record.type}</strong> record{" "}
      <strong>{record.name}</strong>? This can&apos;t be undone.
    </Modal>
  );
}
