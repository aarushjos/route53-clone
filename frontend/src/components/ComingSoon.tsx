"use client";

import {
  Box,
  Container,
  ContentLayout,
  Header,
} from "@cloudscape-design/components";

export default function ComingSoon({ title }: { title: string }) {
  return (
    <ContentLayout header={<Header variant="h1">{title}</Header>}>
      <Container>
        <Box textAlign="center" padding="xxl" color="text-body-secondary">
          <Box variant="h2">Coming soon</Box>
          <Box variant="p">This section isn&apos;t available yet.</Box>
        </Box>
      </Container>
    </ContentLayout>
  );
}
