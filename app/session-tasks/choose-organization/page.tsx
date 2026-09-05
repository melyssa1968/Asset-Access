import { TaskChooseOrganization } from "@clerk/nextjs";

export default function Page() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px 16px",
        background: "#f6f7fb",
      }}
    >
      <TaskChooseOrganization redirectUrlComplete="/asset-access" />
    </main>
  );
}
