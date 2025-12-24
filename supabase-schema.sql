-- Create table for storing hour tracking data
CREATE TABLE IF NOT EXISTS hour_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  hour INTEGER NOT NULL CHECK (hour >= 0 AND hour < 24),
  tags TEXT[] DEFAULT '{}',
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, date, hour)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_hour_entries_user_date ON hour_entries(user_id, date);
CREATE INDEX IF NOT EXISTS idx_hour_entries_user_id ON hour_entries(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE hour_entries ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own entries
CREATE POLICY "Users can view own hour entries" 
  ON hour_entries FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own entries
CREATE POLICY "Users can insert own hour entries" 
  ON hour_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own entries
CREATE POLICY "Users can update own hour entries" 
  ON hour_entries FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own entries
CREATE POLICY "Users can delete own hour entries" 
  ON hour_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_hour_entries_updated_at 
  BEFORE UPDATE ON hour_entries 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
