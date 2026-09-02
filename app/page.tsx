import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Workspace from "./workspace";

export default async function Home() {
  const { userId } = await auth();
  if (!userId) redirect("/asset-access/sign-in");
  return <Workspace />;
}
