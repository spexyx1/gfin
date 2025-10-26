/*
  # Create messaging tables for real-time communication

  1. New Tables
    - `conversations`
      - `id` (uuid, primary key)
      - `participants` (jsonb, array of participant user IDs)
      - `created_at` (timestamptz, creation timestamp)
      - `updated_at` (timestamptz, last update timestamp)
    
    - `messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references conversations.id)
      - `sender_id` (uuid, references profiles.id)
      - `content` (text, message content)
      - `message_type` (text, type: text/order/system)
      - `order_id` (uuid, optional reference to orders.id)
      - `read` (boolean, read status)
      - `created_at` (timestamptz, creation timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for conversation participants only
    - Add policies for message senders and receivers

  3. Functions
    - Create function to update conversation updated_at on new messages
    - Create function to get unread message count
    - Create function to mark messages as read

  4. Indexes
    - Create indexes for better query performance
*/

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participants jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure participants array has exactly 2 members
  CONSTRAINT participants_count CHECK (jsonb_array_length(participants) = 2)
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'order', 'system')),
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies
CREATE POLICY "Users can view conversations they participate in"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (participants ? auth.uid()::text);

CREATE POLICY "Authenticated users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (participants ? auth.uid()::text);

CREATE POLICY "Participants can update conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (participants ? auth.uid()::text)
  WITH CHECK (participants ? auth.uid()::text);

-- Message policies
CREATE POLICY "Users can view messages in their conversations"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND participants ? auth.uid()::text
    )
  );

CREATE POLICY "Users can send messages to their conversations"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations 
      WHERE id = conversation_id 
      AND participants ? auth.uid()::text
    )
  );

CREATE POLICY "Users can update their own messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id)
  WITH CHECK (auth.uid() = sender_id);

-- Create trigger to update conversation updated_at on new messages
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET updated_at = now() 
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- Create function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_count(user_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE c.participants ? user_id::text
    AND m.sender_id != user_id
    AND m.read = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark conversation messages as read
CREATE OR REPLACE FUNCTION mark_conversation_read(conv_id uuid, user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE messages 
  SET read = true 
  WHERE conversation_id = conv_id 
  AND sender_id != user_id 
  AND read = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to find or create conversation between two users
CREATE OR REPLACE FUNCTION find_or_create_conversation(user1_id uuid, user2_id uuid)
RETURNS uuid AS $$
DECLARE
  conv_id uuid;
  participants_array jsonb;
BEGIN
  -- Create sorted participants array
  IF user1_id < user2_id THEN
    participants_array = jsonb_build_array(user1_id::text, user2_id::text);
  ELSE
    participants_array = jsonb_build_array(user2_id::text, user1_id::text);
  END IF;
  
  -- Try to find existing conversation
  SELECT id INTO conv_id
  FROM conversations
  WHERE participants = participants_array;
  
  -- If not found, create new conversation
  IF conv_id IS NULL THEN
    INSERT INTO conversations (participants)
    VALUES (participants_array)
    RETURNING id INTO conv_id;
  END IF;
  
  RETURN conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS conversations_participants_idx ON conversations USING gin(participants);
CREATE INDEX IF NOT EXISTS conversations_updated_at_idx ON conversations(updated_at);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS messages_sender_id_idx ON messages(sender_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);
CREATE INDEX IF NOT EXISTS messages_read_idx ON messages(read);
CREATE INDEX IF NOT EXISTS messages_message_type_idx ON messages(message_type);