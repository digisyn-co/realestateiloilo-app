import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initials, timeAgo } from "@/lib/format";
import { MessageComposer } from "@/components/app/MessageComposer";
import { EmptyState } from "@/components/app/EmptyState";

export const dynamic = "force-dynamic";

export default async function MessagesPage({ searchParams }: { searchParams: { t?: string } }) {
  const user = await getSessionUser();
  if (!user) redirect("/login?next=/messages");

  const threads = await prisma.thread.findMany({
    where: { OR: [{ buyerId: user.id }, { agent: { userId: user.id } }] },
    include: {
      buyer: true,
      agent: { include: { user: true } },
      listing: { include: { property: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  if (threads.length === 0) {
    return (
      <div className="pt-6">
        <h1 className="mb-4 font-serif text-[30px] text-ink">Messages</h1>
        <EmptyState title="No messages yet." body="Message a broker from any listing and the conversation shows up here." actionLabel="Browse homes" actionHref="/browse" />
      </div>
    );
  }

  const activeId = searchParams.t || threads[0].id;
  const active = threads.find((t) => t.id === activeId) || threads[0];
  const messages = await prisma.message.findMany({ where: { threadId: active.id }, orderBy: { createdAt: "asc" }, include: { sender: true } });

  const otherName = (t: (typeof threads)[number]) => (t.buyerId === user.id ? t.agent?.user.name || "Broker" : t.buyer.name);

  return (
    <div className="pt-6">
      <h1 className="mb-4 font-serif text-[30px] text-ink">Messages</h1>
      <div className="grid gap-4 md:grid-cols-[300px_1fr]">
        <div className="grid h-fit gap-2">
          {threads.map((t) => (
            <Link
              key={t.id}
              href={`/messages?t=${t.id}`}
              className={`flex items-center gap-3 rounded-xl2 p-3 ${t.id === active.id ? "bg-surface shadow-card" : "bg-transparent hover:bg-surface/60"}`}
            >
              <div className="grid h-11 w-11 flex-none place-items-center rounded-full bg-ink font-sans text-[13px] font-bold text-white">
                {initials(otherName(t))}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <span className="truncate font-sans text-[14.5px] font-semibold text-ink">{otherName(t)}</span>
                  <span className="flex-none font-sans text-[11.5px] text-muted-2">{t.messages[0] ? timeAgo(t.messages[0].createdAt) : ""}</span>
                </div>
                <div className="truncate font-sans text-[13px] text-muted">{t.messages[0]?.body || t.listing?.property.title || "New conversation"}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="flex min-h-[420px] flex-col rounded-xl2 bg-surface p-4 shadow-card">
          <div className="mb-3 flex items-center gap-3 border-b border-line-2 pb-3">
            <div className="grid h-11 w-11 place-items-center rounded-full bg-ink font-sans text-[13px] font-bold text-white">{initials(otherName(active))}</div>
            <div>
              <div className="font-sans text-[15px] font-semibold text-ink">{otherName(active)}</div>
              {active.listing && <div className="font-sans text-[12.5px] text-muted">{active.listing.property.title}</div>}
            </div>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto pb-3">
            {messages.map((m) => {
              const mine = m.senderId === user.id;
              return (
                <div
                  key={m.id}
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 font-sans text-[14px] ${mine ? "self-end bg-accent text-white" : "self-start bg-sand text-ink-2"}`}
                >
                  {m.body}
                </div>
              );
            })}
          </div>
          <MessageComposer threadId={active.id} />
        </div>
      </div>
    </div>
  );
}
