"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Header,
  Link,
  Pagination,
  Select,
  SpaceBetween,
  Table,
  TextFilter,
} from "@cloudscape-design/components";
import DeleteZoneModal from "@/components/DeleteZoneModal";
import { useNotifications } from "@/lib/notifications";
import type { Zone } from "@/lib/types";
import { useDeleteZone, useZones } from "@/lib/zones";

const PAGE_SIZE = 3;

const TYPE_OPTIONS = [
  { label: "All types", value: "" },
  { label: "Public", value: "public" },
  { label: "Private", value: "private" },
];

export default function HostedZonesPage() {
  const router = useRouter();
  const { notify } = useNotifications();

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [typeOption, setTypeOption] = useState(TYPE_OPTIONS[0]);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Zone[]>([]);
  const [toDelete, setToDelete] = useState<Zone | null>(null);

  const { data, isLoading } = useZones({
    search,
    type: typeOption.value,
    page,
    pageSize: PAGE_SIZE,
  });
  const deleteZone = useDeleteZone();

  const total = data?.total ?? 0;
  const pagesCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const filtered = search !== "" || typeOption.value !== "";

  const goTo = (href?: string) => {
    if (href) router.push(href);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await deleteZone.mutateAsync(toDelete.id);
      notify(
        "success",
        `Hosted zone ${toDelete.name} was successfully deleted.`,
      );
      setSelected([]);
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Could not delete the hosted zone",
      );
    } finally {
      setToDelete(null);
    }
  };

  return (
    <>
      <Table<Zone>
        variant="full-page"
        stickyHeader
        trackBy="id"
        items={data?.items ?? []}
        loading={isLoading}
        loadingText="Loading hosted zones"
        selectionType="single"
        selectedItems={selected}
        onSelectionChange={({ detail }) => setSelected(detail.selectedItems)}
        columnDefinitions={[
          {
            id: "name",
            header: "Hosted zone name",
            cell: (z) => (
              <Link
                href={`/hosted-zones/${z.id}`}
                onFollow={(e) => {
                  e.preventDefault();
                  goTo(e.detail.href);
                }}
              >
                {z.name}
              </Link>
            ),
          },
          {
            id: "type",
            header: "Type",
            cell: (z) => (z.type === "public" ? "Public" : "Private"),
          },
          {
            id: "records",
            header: "Record count",
            cell: (z) => z.record_count,
          },
          {
            id: "comment",
            header: "Description",
            cell: (z) => z.comment || "-",
          },
          {
            id: "id",
            header: "Hosted zone ID",
            cell: (z) => `Z${String(z.id).padStart(8, "0")}`,
          },
        ]}
        header={
          <Header
            variant="awsui-h1-sticky"
            counter={`(${total})`}
            actions={
              <SpaceBetween direction="horizontal" size="xs">
                <Button
                  disabled={selected.length === 0}
                  onClick={() => goTo(`/hosted-zones/${selected[0].id}`)}
                >
                  View details
                </Button>
                <Button
                  disabled={selected.length === 0}
                  onClick={() => setToDelete(selected[0])}
                >
                  Delete
                </Button>
                <Button
                  variant="primary"
                  onClick={() => goTo("/hosted-zones/create")}
                >
                  Create hosted zone
                </Button>
              </SpaceBetween>
            }
          >
            Hosted zones
          </Header>
        }
        filter={
          <SpaceBetween direction="horizontal" size="xs">
            <TextFilter
              filteringText={searchInput}
              filteringPlaceholder="Search hosted zones"
              filteringAriaLabel="Search hosted zones"
              onChange={({ detail }) => setSearchInput(detail.filteringText)}
              onDelayedChange={({ detail }) => {
                setSearch(detail.filteringText);
                setPage(1);
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
              }}
            />
          </SpaceBetween>
        }
        pagination={
          <Pagination
            currentPageIndex={page}
            pagesCount={pagesCount}
            onChange={({ detail }) => setPage(detail.currentPageIndex)}
          />
        }
        empty={
          <Box textAlign="center" color="inherit">
            <Box variant="strong" textAlign="center" color="inherit">
              {filtered ? "No matches" : "No hosted zones"}
            </Box>
            <Box variant="p" padding={{ bottom: "s" }} color="inherit">
              {filtered
                ? "No hosted zones match your search."
                : "You don't have any hosted zones yet."}
            </Box>
            {!filtered && (
              <Button onClick={() => goTo("/hosted-zones/create")}>
                Create hosted zone
              </Button>
            )}
          </Box>
        }
      />

      {toDelete && (
        <DeleteZoneModal
          key={toDelete.id}
          zone={toDelete}
          loading={deleteZone.isPending}
          onClose={() => setToDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </>
  );
}
