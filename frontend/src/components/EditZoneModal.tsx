"use client";

import { useState } from "react";
import {
  Alert,
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
  error: string;
  onClose: () => void;
  onSave: (comment: string) => void;
};

export default function EditZoneModal({
  zone,
  loading,
  error,
  onClose,
  onSave,
}: Props) {
  const [comment, setComment] = useState(zone.comment);

  return (
    <Modal
      visible
      onDismiss={onClose}
      header="Edit hosted zone"
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={loading}
              onClick={() => onSave(comment)}
            >
              Save
            </Button>
          </SpaceBetween>
        </Box>
      }
    >
      <SpaceBetween size="m">
        {error ? <Alert type="error">{error}</Alert> : null}
        <FormField label="Description - optional">
          <Input
            value={comment}
            onChange={({ detail }) => setComment(detail.value)}
          />
        </FormField>
      </SpaceBetween>
    </Modal>
  );
}
