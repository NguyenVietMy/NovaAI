# 📚 Project Context for Cursor

## 🔑 Environment Variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
YOUTUBE_API_KEY
OPENAI_API_KEY

---

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.folders (
id uuid NOT NULL DEFAULT gen_random_uuid(),
project_id uuid,
name text NOT NULL,
color text DEFAULT '#e5e7eb'::text,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT folders_pkey PRIMARY KEY (id),
CONSTRAINT folders_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);
CREATE TABLE public.items (
id uuid NOT NULL DEFAULT gen_random_uuid(),
project_id uuid NOT NULL,
folder_id uuid,
type text NOT NULL,
name text NOT NULL,
data jsonb,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT items_pkey PRIMARY KEY (id),
CONSTRAINT items_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
CONSTRAINT items_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.folders(id)
);
CREATE TABLE public.projects (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id text,
name text NOT NULL,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT projects_pkey PRIMARY KEY (id),
CONSTRAINT projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.subscriptions (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id text,
stripe_id text UNIQUE,
price_id text,
stripe_price_id text,
currency text,
interval text,
status text,
current_period_start bigint,
current_period_end bigint,
cancel_at_period_end boolean,
amount bigint,
started_at bigint,
ends_at bigint,
ended_at bigint,
canceled_at bigint,
customer_cancellation_reason text,
customer_cancellation_comment text,
metadata jsonb,
custom_field_data jsonb,
customer_id text,
created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
CONSTRAINT subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id)
);
CREATE TABLE public.users (
id text NOT NULL,
avatar_url text,
user_id text UNIQUE,
token_identifier text NOT NULL,
subscription text,
credits text,
image text,
created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
updated_at timestamp with time zone,
email text,
name text,
full_name text,
CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.webhook_events (
id uuid NOT NULL DEFAULT gen_random_uuid(),
event_type text NOT NULL,
type text NOT NULL,
stripe_event_id text,
data jsonb,
created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
modified_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
CONSTRAINT webhook_events_pkey PRIMARY KEY (id)
);
CREATE TABLE public.youtube_outline_cache (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id text,
input_params jsonb,
output jsonb,
version integer NOT NULL DEFAULT 1,
is_active boolean NOT NULL DEFAULT true,
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT youtube_outline_cache_pkey PRIMARY KEY (id),
CONSTRAINT youtube_outline_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.youtube_script_cache (
id uuid NOT NULL DEFAULT gen_random_uuid(),
user_id text,
input_params jsonb,
output jsonb,
version integer NOT NULL DEFAULT 1,
is_active boolean NOT NULL DEFAULT true,2
created_at timestamp with time zone NOT NULL DEFAULT now(),
CONSTRAINT youtube_script_cache_pkey PRIMARY KEY (id),
CONSTRAINT youtube_script_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.youtube_transcript_cache (
id uuid NOT NULL DEFAULT gen_random_uuid(),
video_id text NOT NULL UNIQUE,
url text NOT NULL,
output jsonb NOT NULL,
created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
user_id text,
CONSTRAINT youtube_transcript_cache_pkey PRIMARY KEY (id),
CONSTRAINT youtube_transcript_cache_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

---

## 🔒 Row Level Security (RLS) Policies

- Users can insert themselves into the `users` table if their `auth.uid()` matches `user_id` and `id`.
- Users can view/select their own data in the `users` table if `auth.uid()` matches `user_id`.

---

## 🚀 Framework & Libraries

- **Next.js 13+ using `app/` directory** with file-based routing.
- **Supabase** for authentication, database, and RLS.
- **yt-dlp** executed from the Node backend to fetch YouTube transcripts.
- **OpenAI API** used for processing or summarization.

---

## 💳 Stripe

- Stripe data is recorded in the `subscriptions` table and incoming events handled via the `webhook_events` table.
- Still finalizing exact product / billing setup.

## 🔗 Relationships

- `subscriptions.user_id` (foreign key to `users.id`)
- `youtube_transcript_cache` indexed on `created_at`
- `stripe_id` is the Stripe subscription ID.
- `customer_id` is the Stripe customer ID.

---
