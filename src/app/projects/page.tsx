import dynamic from "next/dynamic";
import {
  listProjects,
  createProject,
  Project,
} from "../actions/projects/projectActions";
import type { FC } from "react";
import { createClient } from "../../../supabase/server";
import DashboardNavbar from "@/components/dashboard-navbar";
import { MoreVertical, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { createClient as createSupabaseClient } from "@/../supabase/client";
import ProjectListClient from "@/components/ProjectListClient";

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
        <ProjectListClient projects={projects} />
      </div>
    </>
  );
}
