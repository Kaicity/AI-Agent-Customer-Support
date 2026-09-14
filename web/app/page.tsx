import Header from "@/components/Header";
import SupportChat from "@/components/SupportChat";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <Header />
      <main className="flex-1 overflow-hidden">
        <SupportChat />
      </main>
    </div>
  );
}

