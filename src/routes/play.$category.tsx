import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/play/$category")({
  component: CategoryLayout,
});

function CategoryLayout() {
  return <Outlet />;
}