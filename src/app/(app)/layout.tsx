import { AppHeader } from "@/components/app/AppHeader";
import { BottomTabs } from "@/components/app/BottomTabs";
import { CompareBar } from "@/components/app/CompareBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-app">
      <AppHeader />
      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 pt-4 md:pb-12">{children}</main>
      <CompareBar />
      <BottomTabs />
    </div>
  );
}
