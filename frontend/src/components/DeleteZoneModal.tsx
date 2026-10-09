"use client";

import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";
import type { Zone } from "@/lib/types";

type Props = {
  zone: Zone;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function DeleteZoneModal({
  zone,
  loading,
  onClose,
  onConfirm,
}: Props) {
  const [text, setText] = useState("");

  return (
    <Modal
      visible
      onDismiss={onClose}
      header="Delete hosted zone"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={text !== "delete"}
              loading={loading}
              onClick={onConfirm}
            >
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        <Box>
          Are you sure you want to delete the hosted zone{" "}
          <strong>{zone.name}</strong>? This can&apos;t be undone.
        </Box>
        <FormField label='To confirm deletion, type "delete" in the field'>
          <Input
            value={text}
            placeholder="delete"
            onChange={({ detail }) => setText(detail.value)}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
