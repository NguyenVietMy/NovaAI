import dynamic from "next/dynamic";
import {
  listProjects,
  createProject,
  Project,
} from "../actions/projects/projectActions";
import type { FC } from "react";
import { createClient } from "../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";

// Explicitly type the dynamic import to accept userId prop
const NewProjectForm = dynamic(() => import("./NewProjectForm"), {
  ssr: false,
}) as FC<{ userId: string }>;

export default async function ProjectsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Handle not logged in (redirect or show message)
    return <div>Please sign in to view your projects.</div>;
  }

  const userId = user.id;
  const projects: Project[] = await listProjects(userId);

  return (
    <>
      <DashboardNavbar />
      <div className="max-w-3xl mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">Your Projects</h1>
        <NewProjectForm userId={userId} />
        <div className="grid gap-4 mt-8">
          {projects.length === 0 && (
            <div className="text-gray-500">No projects yet.</div>
          )}
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/projects/${project.id}`}
              className="block bg-gray-100 rounded-lg p-4 hover:bg-gray-200 transition"
            >
              <div className="font-semibold text-lg">{project.name}</div>
              <div className="text-xs text-gray-500 mt-1">
                Created: {new Date(project.created_at).toLocaleDateString()}
              </div>
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
