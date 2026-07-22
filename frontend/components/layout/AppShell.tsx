import { ReactNode, useEffect } from "react";
import { AvatarProvider, useAvatar } from "../../context/AvatarContext";


interface AppShellProps {
  children: ReactNode;
}


function AvatarLoader() {
  const { refreshAvatar } = useAvatar();
  useEffect(() => {
    refreshAvatar();
  }, [refreshAvatar]);
  return null;
}


export default function AppShell({ children }: AppShellProps) {
  return (
    <AvatarProvider>
      <AvatarLoader />
      <main className="min-h-screen bg-slate-50 text-slate-900">
        <div className="mx-auto flex min-h-screen w-full max-w-[1360px] flex-col px-3 py-8 md:px-4">
          {children}
        </div>
      </main>
    </AvatarProvider>
  );
}