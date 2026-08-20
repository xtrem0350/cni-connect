import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/declarations")({
  beforeLoad: () => {
    throw redirect({ to: "/mes-declarations" });
  },
  head: () => ({
    meta: [
      { title: "Mes déclarations — Retrouve CNI 2026" },
      { name: "description", content: "Suivez vos déclarations et leur état." },
    ],
  }),
  component: () => null,
});
