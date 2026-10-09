"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Alert,
  Badge,
  Box,
  Button,
  ColumnLayout,
  Container,
  ContentLayout,
  ExpandableSection,
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
import { useBulkDeleteRecords, useRecords } from "@/lib/records";
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

const isProtectedRecord = (zone: Zone, r: DnsRecord) =>
  r.type === "SOA" || (r.type === "NS" && r.name === zone.name);

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

function NotAvailable() {
  return (
    <Container>
      <Box textAlign="center" color="text-body-secondary" padding="l">
        This feature isn&apos;t available in this demo.
      </Box>
    </Container>
  );
}

export default function ZoneDetailsPage() {
  const params = useParams<{ id: string }>();
  const zoneId = Number(params.id);
  const router = useRouter();
  const { notify } = useNotifications();

  const { data: zone, isLoading, error } = useZone(zoneId);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeOption, setTypeOption] = useState(TYPE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<DnsRecord[]>([]);

  const [editingZone, setEditingZone] = useState(false);
  const [deletingZone, setDeletingZone] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [editError, setEditError] = useState("");

  const {
    data: records,
    isLoading: recordsLoading,
    isFetching,
    refetch,
  } = useRecords(zoneId, {
    search,
    type: typeOption.value,
    page,
    pageSize: PAGE_SIZE,
  });
  const updateZone = useUpdateZone(zoneId);
  const deleteZone = useDeleteZone();
  const bulkDelete = useBulkDeleteRecords(zoneId);

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
  const deletable = selected.filter((r) => !isProtectedRecord(zone, r));
  const skipped = selected.length - deletable.length;

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

  const removeSelected = async () => {
    try {
      const res = await bulkDelete.mutateAsync(deletable.map((r) => r.id));
      notify(
        "success",
        res.deleted === 1
          ? `Record ${deletable[0].name} (${deletable[0].type}) was successfully deleted.`
          : `${res.deleted} records were successfully deleted.`,
      );
      setSelected([]);

      if (records && res.deleted >= records.items.length && page > 1)
        setPage(page - 1);
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Could not delete the records",
      );
    } finally {
      setConfirmingDelete(false);
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
            <Button onClick={() => setDeletingZone(true)}>Delete zone</Button>
          }
        >
          <Badge color="blue">
            {zone.type === "public" ? "Public" : "Private"}
          </Badge>{" "}
          {zone.name}
        </Header>
      }
    >
      <SpaceBetween size="l">
        <ExpandableSection
          variant="container"
          headerText="Hosted zone details"
          headerActions={
            <Button
              onClick={() => {
                setEditError("");
                setEditingZone(true);
              }}
            >
              Edit hosted zone
            </Button>
          }
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
        </ExpandableSection>

        <Tabs
          tabs={[
            {
              id: "records",
              label: `Records (${zone.record_count})`,
              content: (
                <Table<DnsRecord>
                  variant="container"
                  resizableColumns
                  trackBy="id"
                  items={records?.items ?? []}
                  loading={recordsLoading}
                  loadingText="Loading records"
                  selectionType="multi"
                  selectedItems={selected}
                  onSelectionChange={({ detail }) =>
                    setSelected(detail.selectedItems)
                  }
                  columnDefinitions={[
                    {
                      id: "name",
                      header: "Record name",
                      cell: (r) => r.name,
                      width: 200,
                    },
                    {
                      id: "type",
                      header: "Type",
                      cell: (r) => r.type,
                      width: 90,
                    },
                    {
                      id: "policy",
                      header: "Routing policy",
                      cell: (r) => r.routing_policy,
                      width: 140,
                    },
                    {
                      id: "diff",
                      header: "Differentiator",
                      cell: () => "-",
                      width: 130,
                    },
                    {
                      id: "alias",
                      header: "Alias",
                      cell: () => "No",
                      width: 80,
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
                      width: 300,
                    },
                    {
                      id: "ttl",
                      header: "TTL (seconds)",
                      cell: (r) => r.ttl.toLocaleString("en-US"),
                      width: 130,
                    },
                    {
                      id: "health",
                      header: "Health check ID",
                      cell: () => "-",
                      width: 140,
                    },
                    {
                      id: "eval",
                      header: "Evaluate target health",
                      cell: () => "-",
                      width: 180,
                    },
                    {
                      id: "rid",
                      header: "Record ID",
                      cell: () => "-",
                      width: 110,
                    },
                  ]}
                  header={
                    <Header
                      variant="h2"
                      counter={`(${total})`}
                      actions={
                        <SpaceBetween direction="horizontal" size="xs">
                          <Button
                            iconName="refresh"
                            ariaLabel="Refresh"
                            loading={isFetching && !recordsLoading}
                            onClick={() => refetch()}
                          />
                          {selected.length === 1 ? (
                            <Button
                              disabled={selected[0].type === "SOA"}
                              onClick={() =>
                                router.push(
                                  `/hosted-zones/${zoneId}/records/${selected[0].id}/edit`,
                                )
                              }
                            >
                              Edit record
                            </Button>
                          ) : null}
                          <Button
                            disabled={deletable.length === 0}
                            onClick={() => setConfirmingDelete(true)}
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
                        filteringPlaceholder="Filter records by name or value"
                        filteringAriaLabel="Filter records"
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
              id: "recovery",
              label: "Accelerated recovery",
              content: <NotAvailable />,
            },
            {
              id: "dnssec",
              label: "DNSSEC signing",
              content: <NotAvailable />,
            },
            {
              id: "tags",
              label: "Hosted zone tags (0)",
              content: <NotAvailable />,
            },
          ]}
        />
      </SpaceBetween>

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
          zone={zone}
          loading={deleteZone.isPending}
          onClose={() => setDeletingZone(false)}
          onConfirm={removeZone}
        />
      )}
      {confirmingDelete && (
        <DeleteRecordModal
          records={deletable}
          skipped={skipped}
          loading={bulkDelete.isPending}
          onClose={() => setConfirmingDelete(false)}
          onConfirm={removeSelected}
        />
      )}
    </ContentLayout>
  );
}
