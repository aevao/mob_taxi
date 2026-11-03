import { createBrowserRouter } from "react-router";
import { ApplicationDetailsPage } from "@/pages/application-details";
import { ApplicationsPage } from "@/pages/applications";
import { DashboardPage } from "@/pages/dashboard";
import { LoginPage } from "@/pages/login";
import { NotFoundPage } from "@/pages/not-found";
import { RidersPage } from "@/pages/riders";
import { AppShell } from "@/widgets/app-shell";
import { RequireAuth } from "./RequireAuth";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    element: (
      <RequireAuth>
        <AppShell />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "applications", element: <ApplicationsPage /> },
      { path: "applications/:id", element: <ApplicationDetailsPage /> },
      { path: "riders", element: <RidersPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
