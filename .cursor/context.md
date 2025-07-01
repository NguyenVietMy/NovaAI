# 📚 Project Context for Cursor

## 🔑 Environment Variables

NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
YOUTUBE_API_KEY
OPENAI_API_KEY

---

## 🗄️ Supabase Tables

### users

- `created_at` (timestamptz)
- `avatar_url` (text)
- `token_identifier` (text)
- `subscription` (text)
- `credits` (text)
- `image` (text)
- `updated_at` (timestamptz)
- `email` (text)
- `name` (text)
- `full_name` (text)
- `id` (text, primary key)
- `user_id` (text)

### subscriptions

- `user_id` (text)
- `stripe_id` (text)
- `price_id` (text)
- `stripe_price_id` (text)
- `currency` (text)
- `interval` (text)
- `status` (text)
- `current_period_start` (int8)
- `current_period_end` (int8)
- `cancel_at_period_end` (bool)
- `amount` (int8)
- `started_at` (int8)
- `ends_at` (int8)
- `ended_at` (int8)
- `canceled_at` (int8)
- `customer_cancellation_reason` (text)
- `customer_id` (text)
- `metadata` (jsonb)
- `custom_field_data` (jsonb)
- `id` (uuid, primary key)
- `created_at` (timestamptz)

### webhook_events

- `event_type` (text)
- `type` (text)
- `stripe_event_id` (text)
- `data` (jsonb)
- `id` (uuid, primary key)
- `created_at` (timestamptz)
- `modified_at` (timestamptz)

### youtube_transcript_cache

- `id` (uuid, primary key)
- `video_id` (text, unique) — YouTube video ID
- `url` (text) — original YouTube URL
- `response` (jsonb) — full JSON returned by `processYouTubeTranscript`
- `created_at` (timestamptz, default now)
- 🔥 Indexed on `created_at` for fast cleanup & ordering

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

---
