"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
  Box,
  Button,
  Container,
  Form,
  FormField,
  Header,
  Input,
  SpaceBetween,
} from "@cloudscape-design/components";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // already logged in? go to the home page
  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box padding={{ top: "xxxl" }}>
      <div style={{ maxWidth: 420, margin: "0 auto" }}>
        <form onSubmit={handleSubmit}>
          <Container header={<Header variant="h1">Sign in</Header>}>
            <Form
              actions={
                <Button
                  variant="primary"
                  formAction="submit"
                  loading={submitting}
                >
                  Sign in
                </Button>
              }
            >
              <SpaceBetween size="l">
                {error && <Alert type="error">{error}</Alert>}
                <FormField label="Email">
                  <Input
                    value={email}
                    onChange={({ detail }) => setEmail(detail.value)}
                  />
                </FormField>
                <FormField label="Password">
                  <Input
                    type="password"
                    value={password}
                    onChange={({ detail }) => setPassword(detail.value)}
                  />
                </FormField>
              </SpaceBetween>
            </Form>
          </Container>
        </form>
      </div>
    </Box>
  );
}
