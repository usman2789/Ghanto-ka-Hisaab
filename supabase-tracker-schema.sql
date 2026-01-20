-- Create table for tracker items (things users want to track)
CREATE TABLE IF NOT EXISTS tracker_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create table for daily tracker logs
CREATE TABLE IF NOT EXISTS tracker_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tracker_item_id UUID REFERENCES tracker_items(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  checked BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, tracker_item_id, date)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tracker_items_user_id ON tracker_items(user_id);
CREATE INDEX IF NOT EXISTS idx_tracker_logs_user_date ON tracker_logs(user_id, date);
CREATE INDEX IF NOT EXISTS idx_tracker_logs_item_id ON tracker_logs(tracker_item_id);

-- Enable RLS
ALTER TABLE tracker_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracker_logs ENABLE ROW LEVEL SECURITY;

-- Policies for tracker_items
CREATE POLICY "Users can view own tracker items" 
  ON tracker_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracker items" 
  ON tracker_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracker items" 
  ON tracker_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracker items" 
  ON tracker_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Policies for tracker_logs
CREATE POLICY "Users can view own tracker logs" 
  ON tracker_logs FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tracker logs" 
  ON tracker_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tracker logs" 
  ON tracker_logs FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tracker logs" 
  ON tracker_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- Create trigger for tracker_items updated_at
CREATE TRIGGER update_tracker_items_updated_at
  BEFORE UPDATE ON tracker_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
