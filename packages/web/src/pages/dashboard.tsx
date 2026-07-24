import { useNavigate } from "react-router";
import { useSession, signOut } from "../auth";

export function DashboardPage() {
  const navigate = useNavigate();
  const { data: session, isPending } = useSession();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  if (isPending) {
    return <p style={{ padding: 20 }}>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1>Google Docs Clone</h1>
        <div>
          <span style={{ marginRight: 12 }}>
            {session?.user?.name || session?.user?.email}
          </span>
          <button onClick={handleSignOut}>Sign out</button>
        </div>
      </header>
      <p>Your documents will appear here.</p>
    </div>
  );
}
