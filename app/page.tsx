import Gallery from "./gallery";
import { getChatGPTUser, chatGPTSignInPath } from "./chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getChatGPTUser();
  return <Gallery user={user ? { name: user.fullName || "Meu ateliê" } : null} signInPath={chatGPTSignInPath("/?studio=1")} />;
}
