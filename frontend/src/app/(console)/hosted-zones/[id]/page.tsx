"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
  Header,
  Pagination,
  Select,
  SpaceBetween,
  Spinner,
  Table,
  Tabs,
  TextFilter,
} from "@cloudscape-design/components";
import DeleteRecordModal from "@/components/DeleteRecordModal";
import DeleteZoneModal from "@/components/DeleteZoneModal";
import EditZoneModal from "@/components/EditZoneModal";
import { useNotifications } from "@/lib/notifications";
import { useDeleteRecord, useRecords } from "@/lib/records";
import type { DnsRecord, Zone } from "@/lib/types";
import { useDeleteZone, useUpdateZone, useZone } from "@/lib/zones";

const PAGE_SIZE = 10;

const TYPE_OPTIONS = [
  { label: "All types", value: "" },
  ...["A", "AAAA", "CAA", "CNAME", "MX", "NS", "PTR", "SOA", "SRV", "TXT"].map(
    (t) => ({
      label: t,
      value: t,
    }),
  ),
];

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Box variant="awsui-key-label">{label}</Box>
      <div>{children}</div>
    </div>
  );
}

export default function ZoneDetailsPage() {
  const params = useParams<{ id: string }>();
  const zoneId = Number(params.id);
  const router = useRouter();
  const { notify } = useNotifications();

  const { data: zone, isLoading, error } = useZone(zoneId);

  // record table state
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeOption, setTypeOption] = useState(TYPE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DnsRecord[]>([]);

  // modals
  const [editingZone, setEditingZone] = useState(false);
  const [deletingZone, setDeletingZone] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<DnsRecord | null>(null);
  const [editError, setEditError] = useState("");

  const { data: records, isLoading: recordsLoading } = useRecords(zoneId, {
    search,
    type: typeOption.value,
    page,
    pageSize: PAGE_SIZE,
  });
  const updateZone = useUpdateZone(zoneId);
  const deleteZone = useDeleteZone();
  const deleteRecord = useDeleteRecord(zoneId);

  if (isLoading) return <Spinner size="large" />;
  if (error || !zone) {
    return (
      <Alert type="error" header="Hosted zone not found">
        <Button onClick={() => router.push("/hosted-zones")}>
          Back to hosted zones
        </Button>
      </Alert>
    );
  }

  const total = records?.total ?? 0;
  const pagesCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = search !== "" || typeOption.value !== "";
  const record = selected[0];
  const isProtected =
    record &&
    (record.type === "SOA" ||
      (record.type === "NS" && record.name === zone.name));

  const saveZone = async (comment: string) => {
    setEditError("");
    try {
      await updateZone.mutateAsync({ comment });
      notify("success", `Hosted zone ${zone.name} was successfully updated.`);
      setEditingZone(false);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Could not update the hosted zone",
      );
    }
  };

  const removeZone = async () => {
    try {
      await deleteZone.mutateAsync(zone.id);
      notify("success", `Hosted zone ${zone.name} was successfully deleted.`);
      router.push("/hosted-zones");
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Could not delete the hosted zone",
      );
      setDeletingZone(false);
    }
  };

  const removeRecord = async () => {
    if (!recordToDelete) return;
    try {
      await deleteRecord.mutateAsync(recordToDelete.id);
      notify(
        "success",
        `Record ${recordToDelete.name} (${recordToDelete.type}) was successfully deleted.`,
      );
      setSelected([]);
      if (records && records.items.length === 1 && page > 1) setPage(page - 1);
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Could not delete the record",
      );
    } finally {
      setRecordToDelete(null);
    }
  };

  const created = new Date(
    zone.created_at.endsWith("Z") ? zone.created_at : zone.created_at + "Z",
  );

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          actions={
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                onClick={() => {
                  setEditError("");
                  setEditingZone(true);
                }}
              >
                Edit hosted zone
              </Button>
              <Button onClick={() => setDeletingZone(true)}>Delete zone</Button>
            </SpaceBetween>
          }
        >
          {zone.name}
        </Header>
      }
    >
      <Tabs
        tabs={[
          {
            id: "records",
            label: `Records (${zone.record_count})`,
            content: (
              <Table<DnsRecord>
                variant="container"
                trackBy="id"
                items={records?.items ?? []}
                loading={recordsLoading}
                loadingText="Loading records"
                selectionType="single"
                selectedItems={selected}
                onSelectionChange={({ detail }) =>
                  setSelected(detail.selectedItems)
                }
                columnDefinitions={[
                  { id: "name", header: "Record name", cell: (r) => r.name },
                  { id: "type", header: "Type", cell: (r) => r.type },
                  {
                    id: "policy",
                    header: "Routing policy",
                    cell: (r) => r.routing_policy,
                  },
                  {
                    id: "values",
                    header: "Value/Route traffic to",
                    cell: (r) =>
                      r.values.map((v, i) => (
                        <div key={i} style={{ wordBreak: "break-all" }}>
                          {v}
                        </div>
                      )),
                  },
                  { id: "ttl", header: "TTL (seconds)", cell: (r) => r.ttl },
                ]}
                header={
                  <Header
                    variant="h2"
                    counter={`(${total})`}
                    actions={
                      <SpaceBetween direction="horizontal" size="xs">
                        <Button
                          disabled={!record || record.type === "SOA"}
                          onClick={() =>
                            router.push(
                              `/hosted-zones/${zoneId}/records/${record.id}/edit`,
                            )
                          }
                        >
                          Edit record
                        </Button>
                        <Button
                          disabled={!record || isProtected}
                          onClick={() => setRecordToDelete(record)}
                        >
                          Delete record
                        </Button>
                        <Button
                          variant="primary"
                          onClick={() =>
                            router.push(
                              `/hosted-zones/${zoneId}/records/create`,
                            )
                          }
                        >
                          Create record
                        </Button>
                      </SpaceBetween>
                    }
                  >
                    Records
                  </Header>
                }
                filter={
                  <SpaceBetween direction="horizontal" size="xs">
                    <TextFilter
                      filteringText={searchInput}
                      filteringPlaceholder="Search records"
                      filteringAriaLabel="Search records"
                      onChange={({ detail }) =>
                        setSearchInput(detail.filteringText)
                      }
                      onDelayedChange={({ detail }) => {
                        setSearch(detail.filteringText);
                        setPage(1);
                        setSelected([]);
                      }}
                    />
                    <Select
                      selectedOption={typeOption}
                      options={TYPE_OPTIONS}
                      onChange={({ detail }) => {
                        setTypeOption(
                          detail.selectedOption as (typeof TYPE_OPTIONS)[number],
                        );
                        setPage(1);
                        setSelected([]);
                      }}
                    />
                  </SpaceBetween>
                }
                pagination={
                  <Pagination
                    currentPageIndex={page}
                    pagesCount={pagesCount}
                    onChange={({ detail }) => {
                      setPage(detail.currentPageIndex);
                      setSelected([]);
                    }}
                  />
                }
                empty={
                  <Box textAlign="center" color="inherit">
                    <Box variant="strong" color="inherit">
                      {filtered ? "No matches" : "No records"}
                    </Box>
                    <Box variant="p" color="inherit">
                      {filtered
                        ? "No records match your search."
                        : "This hosted zone has no records."}
                    </Box>
                  </Box>
                }
              />
            ),
          },
          {
            id: "details",
            label: "Hosted zone details",
            content: (
              <Container
                header={<Header variant="h2">Hosted zone details</Header>}
              >
                <ColumnLayout columns={3} variant="text-grid">
                  <Detail label="Hosted zone name">{zone.name}</Detail>
                  <Detail label="Hosted zone ID">{`Z${String(zone.id).padStart(8, "0")}`}</Detail>
                  <Detail label="Type">
                    {zone.type === "public"
                      ? "Public hosted zone"
                      : "Private hosted zone"}
                  </Detail>
                  <Detail label="Description">{zone.comment || "-"}</Detail>
                  <Detail label="Record count">{zone.record_count}</Detail>
                  <Detail label="Created">{created.toLocaleString()}</Detail>
                </ColumnLayout>
              </Container>
            ),
          },
        ]}
      />

      {editingZone && (
        <EditZoneModal
          zone={zone}
          loading={updateZone.isPending}
          error={editError}
          onClose={() => setEditingZone(false)}
          onSave={saveZone}
        />
      )}
      {deletingZone && (
        <DeleteZoneModal
          zone={zone as Zone}
          loading={deleteZone.isPending}
          onClose={() => setDeletingZone(false)}
          onConfirm={removeZone}
        />
      )}
      {recordToDelete && (
        <DeleteRecordModal
          record={recordToDelete}
          loading={deleteRecord.isPending}
          onClose={() => setRecordToDelete(null)}
          onConfirm={removeRecord}
        />
      )}
    </ContentLayout>
  );
}
