import { PageTitle } from "@/components/dash/DashShell";
import { ListingWizard } from "@/components/dash/ListingWizard";

export const dynamic = "force-dynamic";

export default function NewListingPage() {
  return (
    <div className="mx-auto max-w-[820px]">
      <PageTitle title="Add a listing" subtitle="Ten quick steps. Drafts autosave locally as you go; publishing submits for admin review." />
      <ListingWizard />
    </div>
  );
}
