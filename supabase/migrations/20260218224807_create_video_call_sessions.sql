/*
  # Create Video Call Sessions Table

  ## Purpose
  Enables peer-to-peer video call signaling between users within existing conversations.
  The actual video/audio is handled by Jitsi Meet (meet.jit.si) - this table only manages
  the call state (ringing, active, ended, declined).

  ## New Tables

  ### call_sessions
  - `id` (uuid, primary key) - Unique call session identifier
  - `conversation_id` (uuid, FK to conversations) - The conversation this call belongs to
  - `initiated_by` (uuid, FK to profiles) - User who started the call
  - `room_name` (text) - Unique Jitsi room name for this call session
  - `status` (text) - Current call state: ringing | active | ended | declined
  - `created_at` (timestamptz) - When the call was initiated
  - `ended_at` (timestamptz, nullable) - When the call was ended or declined

  ## Security
  - RLS enabled on call_sessions
  - Only conversation participants can view, insert, or update call sessions
  - Prevents unauthorized access to call metadata

  ## Notes
  1. Room names are generated client-side using conversationId + timestamp for uniqueness
  2. Status transitions: ringing → active (accepted) or ringing → declined/ended
  3. No audio/video data is stored - only signaling state
  4. Cascade deletes: removing a conversation removes its call sessions
*/

CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  initiated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  room_name text NOT NULL,
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'declined')),
  created_at timestamptz DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS call_sessions_conversation_id_idx ON call_sessions(conversation_id);
CREATE INDEX IF NOT EXISTS call_sessions_initiated_by_idx ON call_sessions(initiated_by);
CREATE INDEX IF NOT EXISTS call_sessions_status_idx ON call_sessions(status);
CREATE INDEX IF NOT EXISTS call_sessions_created_at_idx ON call_sessions(created_at DESC);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Conversation participants can view call sessions"
  ON call_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = call_sessions.conversation_id
      AND conversations.participants @> jsonb_build_array(auth.uid()::text)
    )
  );

CREATE POLICY "Conversation participants can initiate calls"
  ON call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = initiated_by
    AND EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = conversation_id
      AND conversations.participants @> jsonb_build_array(auth.uid()::text)
    )
  );

CREATE POLICY "Conversation participants can update call status"
  ON call_sessions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = call_sessions.conversation_id
      AND conversations.participants @> jsonb_build_array(auth.uid()::text)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE conversations.id = call_sessions.conversation_id
      AND conversations.participants @> jsonb_build_array(auth.uid()::text)
    )
  );
