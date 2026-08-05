-- =====================================================
-- GST Website Database Migration
-- Add registrations master table + application_id FK
-- =====================================================

-- Step 1: Create the master registrations table
CREATE TABLE IF NOT EXISTS [registrations] (
    [application_id] INTEGER PRIMARY KEY AUTOINCREMENT,
    [session_id] TEXT UNIQUE,
    [created_at] DATETIME DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME DEFAULT CURRENT_TIMESTAMP,
    [status] TEXT DEFAULT 'draft',
    [current_step] TEXT DEFAULT 'main_html'
);

-- Step 2: Add application_id column to all step tables
-- (ALTER TABLE ADD COLUMN is safe to run multiple times if column exists)

ALTER TABLE [main_html] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [main] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [otp] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [dash2] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [otp2] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [dash3] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [dash4] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [dash5] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [dash6] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [dash7] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [principlepalace] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [additionalplaces] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [goods] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [state_20specific] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [adhar] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [loginpage] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [welcome] ADD COLUMN [application_id] INTEGER;
ALTER TABLE [test_up] ADD COLUMN [application_id] INTEGER;

-- Step 3: Create indexes on application_id for fast lookups
CREATE INDEX IF NOT EXISTS [idx_main_html_app] ON [main_html] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_main_app] ON [main] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_otp_app] ON [otp] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_dash2_app] ON [dash2] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_otp2_app] ON [otp2] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_dash3_app] ON [dash3] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_dash4_app] ON [dash4] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_dash5_app] ON [dash5] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_dash6_app] ON [dash6] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_dash7_app] ON [dash7] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_principlepalace_app] ON [principlepalace] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_additionalplaces_app] ON [additionalplaces] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_goods_app] ON [goods] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_state_specific_app] ON [state_20specific] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_adhar_app] ON [adhar] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_loginpage_app] ON [loginpage] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_welcome_app] ON [welcome] ([application_id]);
CREATE INDEX IF NOT EXISTS [idx_test_up_app] ON [test_up] ([application_id]);

-- Step 4: Create index on session_id for fast lookups
CREATE INDEX IF NOT EXISTS [idx_registrations_session] ON [registrations] ([session_id]);

-- Step 5: Migrate existing data - link rows that share Session ID
-- Create registrations from existing Session IDs in main_html
INSERT OR IGNORE INTO [registrations] ([session_id])
SELECT DISTINCT [Session ID] FROM [main_html]
WHERE [Session ID] IS NOT NULL AND [Session ID] != '';

-- Link main_html rows to their registration
UPDATE [main_html]
SET [application_id] = (
    SELECT [application_id] FROM [registrations]
    WHERE [registrations].[session_id] = [main_html].[Session ID]
)
WHERE [Session ID] IS NOT NULL AND [Session ID] != '';

-- Link otp rows
UPDATE [otp]
SET [application_id] = (
    SELECT [application_id] FROM [registrations]
    WHERE [registrations].[session_id] = [otp].[Session ID]
)
WHERE [Session ID] IS NOT NULL AND [Session ID] != '';

-- Link dash2 rows
UPDATE [dash2]
SET [application_id] = (
    SELECT [application_id] FROM [registrations]
    WHERE [registrations].[session_id] = [dash2].[Session ID]
)
WHERE [Session ID] IS NOT NULL AND [Session ID] != '';

-- Link otp2 rows
UPDATE [otp2]
SET [application_id] = (
    SELECT [application_id] FROM [registrations]
    WHERE [registrations].[session_id] = [otp2].[Session ID]
)
WHERE [Session ID] IS NOT NULL AND [Session ID] != '';

-- Link test_up rows
UPDATE [test_up]
SET [application_id] = (
    SELECT [application_id] FROM [registrations]
    WHERE [registrations].[session_id] = [test_up].[Session ID]
)
WHERE [Session ID] IS NOT NULL AND [Session ID] != '';

-- Step 6: Verify migration
SELECT 'registrations' AS tbl, COUNT(*) AS cnt FROM [registrations]
UNION ALL
SELECT 'main_html', COUNT(*) FROM [main_html] WHERE [application_id] IS NOT NULL
UNION ALL
SELECT 'otp', COUNT(*) FROM [otp] WHERE [application_id] IS NOT NULL
UNION ALL
SELECT 'dash2', COUNT(*) FROM [dash2] WHERE [application_id] IS NOT NULL;
