import { PackStudio } from './pack-studio';
import { chatGPTSignInPath, getChatGPTUser } from './chatgpt-auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const user = await getChatGPTUser();
  return <PackStudio userName={user?.fullName ?? user?.email ?? null} signInPath={chatGPTSignInPath('/')} />;
}
