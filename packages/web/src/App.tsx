import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { useSession } from "./auth";
import { LoginPage } from "./pages/login";
import { SignupPage } from "./pages/signup";
import { DashboardPage } from "./pages/dashboard";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isPending, data: session } = useSession();

  if (isPending) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isPending, data: session } = useSession();

  if (isPending) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicRoute>
              <SignupPage />
            </PublicRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
