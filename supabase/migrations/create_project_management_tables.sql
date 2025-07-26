   -- Create project management tables
-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT projects_pkey PRIMARY KEY (id),
    CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Folders table
CREATE TABLE IF NOT EXISTS public.folders (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid,
    name text NOT NULL,
    color text DEFAULT '#e5e7eb'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    owner_id text,
    CONSTRAINT folders_pkey PRIMARY KEY (id),
    CONSTRAINT folders_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
    CONSTRAINT folders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- Items table
CREATE TABLE IF NOT EXISTS public.items (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    project_id uuid,
    folder_id uuid,
    type text NOT NULL,
    name text NOT NULL,
    data jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    owner_id text,
    CONSTRAINT items_pkey PRIMARY KEY (id),
    CONSTRAINT items_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.users(id),
    CONSTRAINT items_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
    CONSTRAINT items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

-- Folder shares table
CREATE TABLE IF NOT EXISTS public.folder_shares (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    folder_id uuid NOT NULL,
    user_id text NOT NULL,
    permission text DEFAULT 'view'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT folder_shares_pkey PRIMARY KEY (id),
    CONSTRAINT folder_shares_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id),
    CONSTRAINT folder_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

-- Item shares table
CREATE TABLE IF NOT EXISTS public.item_shares (
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    item_id uuid NOT NULL,
    user_id text NOT NULL,
    permission text DEFAULT 'view'::text,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT item_shares_pkey PRIMARY KEY (id),
    CONSTRAINT item_shares_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
    CONSTRAINT item_shares_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id)
);

-- Create indexes for efficient querying
CREATE INDEX idx_projects_user_id ON public.projects(user_id);
CREATE INDEX idx_folders_project_id ON public.folders(project_id);
CREATE INDEX idx_folders_owner_id ON public.folders(owner_id);
CREATE INDEX idx_items_project_id ON public.items(project_id);
CREATE INDEX idx_items_folder_id ON public.items(folder_id);
CREATE INDEX idx_items_owner_id ON public.items(owner_id);
CREATE INDEX idx_folder_shares_folder_id ON public.folder_shares(folder_id);
CREATE INDEX idx_folder_shares_user_id ON public.folder_shares(user_id);
CREATE INDEX idx_item_shares_item_id ON public.item_shares(item_id);
CREATE INDEX idx_item_shares_user_id ON public.item_shares(user_id);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view own projects" ON public.projects
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own projects" ON public.projects
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own projects" ON public.projects
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own projects" ON public.projects
    FOR DELETE USING (auth.uid()::text = user_id);

-- RLS Policies for folders
CREATE POLICY "Users can view own folders" ON public.folders
    FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can insert own folders" ON public.folders
    FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Users can update own folders" ON public.folders
    FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can delete own folders" ON public.folders
    FOR DELETE USING (auth.uid()::text = owner_id);

-- RLS Policies for items
CREATE POLICY "Users can view own items" ON public.items
    FOR SELECT USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can insert own items" ON public.items
    FOR INSERT WITH CHECK (auth.uid()::text = owner_id);

CREATE POLICY "Users can update own items" ON public.items
    FOR UPDATE USING (auth.uid()::text = owner_id);

CREATE POLICY "Users can delete own items" ON public.items
    FOR DELETE USING (auth.uid()::text = owner_id);

-- RLS Policies for folder_shares
CREATE POLICY "Users can view folder shares" ON public.folder_shares
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert folder shares" ON public.folder_shares
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- RLS Policies for item_shares
CREATE POLICY "Users can view item shares" ON public.item_shares
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert item shares" ON public.item_shares
    FOR INSERT WITH CHECK (auth.uid()::text = user_id); 