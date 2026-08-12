import { PageTitle } from "@/components/dash/DashShell";
import { CreateProjectForm } from "@/components/dev/CreateProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-[760px]">
      <PageTitle title="New project" subtitle="Create a development. You can add buildings and units next." />
      <CreateProjectForm />
    </div>
  );
}
