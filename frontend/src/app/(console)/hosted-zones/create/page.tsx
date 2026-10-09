"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Container,
  ContentLayout,
  Form,
  FormField,
  Header,
  Input,
  RadioGroup,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useNotifications } from "@/lib/notifications";
import { useCreateZone } from "@/lib/zones";

export default function CreateZonePage() {
  const router = useRouter();
  const { notify } = useNotifications();
  const createZone = useCreateZone();

  const [name, setName] = useState("");
  const [comment, setComment] = useState("");
  const [type, setType] = useState("public");
  const [error, setError] = useState("");

  const submit = async () => {
    setError("");
    try {
      const zone = await createZone.mutateAsync({ name, comment, type });
      notify("success", `Hosted zone ${zone.name} was successfully created.`);
      router.push("/hosted-zones");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  return (
    <ContentLayout
      header={
        <Header
          variant="h1"
          description="Specify the domain name and settings for your new hosted zone."
        >
          Create hosted zone
        </Header>
      }
    >
      <Form
        errorText={error}
        actions={
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" onClick={() => router.push("/hosted-zones")}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={name.trim() === ""}
              loading={createZone.isPending}
              onClick={submit}
            >
              Create hosted zone
            </Button>
          </SpaceBetween>
        }
      >
        <SpaceBetween size="l">
          <Container
            header={<Header variant="h2">Hosted zone configuration</Header>}
          >
            <SpaceBetween size="l">
              <FormField
                label="Domain name"
                description="The name of the domain you want to route traffic for."
                constraintText="Example: example.com"
              >
                <Input
                  value={name}
                  onChange={({ detail }) => setName(detail.value)}
                />
              </FormField>
              <FormField label="Description - optional">
                <Input
                  value={comment}
                  onChange={({ detail }) => setComment(detail.value)}
                />
              </FormField>
              <FormField label="Type">
                <RadioGroup
                  value={type}
                  onChange={({ detail }) => setType(detail.value)}
                  items={[
                    {
                      value: "public",
                      label: "Public hosted zone",
                      description: "Routes traffic on the internet.",
                    },
                    {
                      value: "private",
                      label: "Private hosted zone",
                      description: "Routes traffic within an Amazon VPC.",
                    },
                  ]}
                />
              </FormField>
            </SpaceBetween>
          </Container>
        </SpaceBetween>
      </Form>
    </ContentLayout>
  );
}
