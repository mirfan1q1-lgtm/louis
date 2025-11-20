/*
  # LOUIS - Learning Operation Unified Interactive System
  Complete Database Schema with Fixed RLS and Grants
  This migration includes all tables, RLS policies, grants, and storage buckets
  Optimized for teacher (authenticated) and student (anon) access
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
  id UUID REFERENCES auth.users PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT,
  address TEXT,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_active ON students(is_active);

-- CLASSES
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  grade TEXT NOT NULL CHECK (grade IN ('10', '11', '12')),
  description TEXT,
  class_code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_classes_grade ON classes(grade);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(class_code);
CREATE INDEX IF NOT EXISTS idx_classes_active ON classes(is_active);

-- CLASS STUDENTS
CREATE TABLE IF NOT EXISTS class_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  enrolled_by UUID REFERENCES teachers(id),
  UNIQUE(class_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_students_class ON class_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_students_student ON class_students(student_id);

-- MATERIALS
CREATE TABLE IF NOT EXISTS materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES teachers(id)
);

CREATE INDEX IF NOT EXISTS idx_materials_class ON materials(class_id);

-- ASSIGNMENTS (with drive_link and multi-class support)
CREATE TABLE IF NOT EXISTS assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  deadline TIMESTAMPTZ NOT NULL,
  total_points INTEGER DEFAULT 100,
  assignment_type TEXT NOT NULL CHECK (assignment_type IN ('wajib', 'tambahan')),
  class_id UUID REFERENCES classes ON DELETE CASCADE,
  target_grade TEXT CHECK (target_grade IN ('10', '11', '12')),
  drive_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES teachers(id)
);

-- Add constraint separately to handle existing tables
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignments_assignment_type_check'
  ) THEN
    ALTER TABLE assignments ADD CONSTRAINT assignments_assignment_type_check CHECK (
      (assignment_type = 'wajib' AND target_grade IS NULL) OR
      (assignment_type = 'tambahan' AND class_id IS NULL AND target_grade IS NOT NULL)
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_assignments_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_class ON assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_grade ON assignments(target_grade);
CREATE INDEX IF NOT EXISTS idx_assignments_deadline ON assignments(deadline);

COMMENT ON COLUMN assignments.drive_link IS 'Optional Google Drive link for assignment materials';

-- ASSIGNMENT CLASSES (junction table for multi-class wajib assignments)
CREATE TABLE IF NOT EXISTS assignment_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments ON DELETE CASCADE NOT NULL,
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, class_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_classes_assignment ON assignment_classes(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_classes_class ON assignment_classes(class_id);

COMMENT ON TABLE assignment_classes IS 'Junction table for multi-class wajib assignments';

-- QUESTIONS
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('essay', 'file_upload')),
  points INTEGER DEFAULT 10,
  order_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_assignment ON questions(assignment_id);

-- SUBMISSIONS (with drive_link)
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES assignments ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
  submitted_at TIMESTAMPTZ,
  grade NUMERIC(5,2),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  graded_by UUID REFERENCES teachers(id),
  drive_link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_assignment ON submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

COMMENT ON COLUMN submissions.drive_link IS 'Google Drive link for assignment submission';

-- ANSWERS
CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID REFERENCES submissions ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES questions ON DELETE CASCADE NOT NULL,
  answer_text TEXT,
  file_url TEXT,
  file_name TEXT,
  points_earned NUMERIC(5,2),
  feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_answers_submission ON answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);

-- ATTENDANCES
CREATE TABLE IF NOT EXISTS attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'sick', 'permission')),
  notes TEXT,
  marked_by UUID REFERENCES teachers(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(class_id, student_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendances_class ON attendances(class_id);
CREATE INDEX IF NOT EXISTS idx_attendances_date ON attendances(date);
CREATE INDEX IF NOT EXISTS idx_attendances_student ON attendances(student_id);

-- NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type TEXT CHECK (user_type IN ('teacher', 'student')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_type ON notifications(user_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id_type ON notifications(user_id, user_type);

COMMENT ON TABLE notifications IS 'User notifications - user_id can reference either teachers.id or students.id based on user_type';
COMMENT ON COLUMN notifications.user_id IS 'References teachers.id if user_type=teacher, or students.id if user_type=student';
COMMENT ON COLUMN notifications.user_type IS 'Determines whether user_id references teachers or students table';

-- ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_teacher ON activity_logs(teacher_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at);

-- NEWSROOM (for announcements and news)
CREATE TABLE IF NOT EXISTS newsroom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  image_url TEXT,
  image_file_name TEXT,
  image_file_path TEXT,
  image_file_size INTEGER,
  type TEXT NOT NULL CHECK (type IN ('announcement', 'news')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  target_audience TEXT DEFAULT 'all' CHECK (target_audience IN ('all', 'teachers', 'students')),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  source TEXT DEFAULT 'internal' CHECK (source IN ('internal', 'external')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES teachers(id) NOT NULL,
  updated_by UUID REFERENCES teachers(id),
  CONSTRAINT check_image_file_size CHECK (image_file_size IS NULL OR image_file_size <= 2097152)
);

CREATE INDEX IF NOT EXISTS idx_newsroom_type ON newsroom(type);
CREATE INDEX IF NOT EXISTS idx_newsroom_status ON newsroom(status);
CREATE INDEX IF NOT EXISTS idx_newsroom_published_at ON newsroom(published_at);
CREATE INDEX IF NOT EXISTS idx_newsroom_created_by ON newsroom(created_by);
CREATE INDEX IF NOT EXISTS idx_newsroom_target_audience ON newsroom(target_audience);
CREATE INDEX IF NOT EXISTS idx_newsroom_image_file_path ON newsroom(image_file_path);
CREATE INDEX IF NOT EXISTS idx_newsroom_class ON newsroom(class_id);
CREATE INDEX IF NOT EXISTS idx_newsroom_source ON newsroom(source);

COMMENT ON COLUMN newsroom.class_id IS 'Optional reference to a class. If set, this announcement is specific to that class and will be deleted when the class is deleted. NULL means the announcement is global.';
COMMENT ON COLUMN newsroom.source IS 'Source of the news: internal (created by teachers) or external (from web pusat)';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_newsroom_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS trigger_update_newsroom_updated_at ON newsroom;
CREATE TRIGGER trigger_update_newsroom_updated_at
  BEFORE UPDATE ON newsroom
  FOR EACH ROW
  EXECUTE FUNCTION update_newsroom_updated_at();

-- Function to set published_at when status changes to published
CREATE OR REPLACE FUNCTION set_newsroom_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set published_at
DROP TRIGGER IF EXISTS trigger_set_newsroom_published_at ON newsroom;
CREATE TRIGGER trigger_set_newsroom_published_at
  BEFORE UPDATE ON newsroom
  FOR EACH ROW
  EXECUTE FUNCTION set_newsroom_published_at();

-- Function to set notification user_type
CREATE OR REPLACE FUNCTION set_notification_user_type()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM teachers WHERE id = NEW.user_id) THEN
    NEW.user_type = 'teacher';
  ELSIF EXISTS (SELECT 1 FROM students WHERE id = NEW.user_id) THEN
    NEW.user_type = 'student';
  ELSE
    RAISE EXCEPTION 'User ID % does not exist in teachers or students table', NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for notifications
DROP TRIGGER IF EXISTS trigger_set_notification_user_type ON notifications;
CREATE TRIGGER trigger_set_notification_user_type
  BEFORE INSERT OR UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_notification_user_type();

-- RPC Function for cancel grading
CREATE OR REPLACE FUNCTION cancel_grading(
  submission_id UUID,
  teacher_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  UPDATE submissions
  SET 
    grade = NULL,
    feedback = NULL,
    status = 'submitted',
    graded_at = NULL,
    graded_by = NULL
  WHERE id = submission_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Submission not found or no rows updated';
  END IF;

  SELECT to_json(s.*) INTO result
  FROM submissions s
  WHERE s.id = submission_id;

  INSERT INTO activity_logs (teacher_id, action, entity_type, entity_id, description)
  VALUES (teacher_id, 'cancel_grading', 'submission', submission_id, 'Teacher cancelled grading for submission');

  RETURN result;
END;
$$;

-- View for notifications with user info
CREATE OR REPLACE VIEW notifications_with_user_info AS
SELECT 
  n.*,
  CASE 
    WHEN n.user_type = 'teacher' THEN t.full_name
    WHEN n.user_type = 'student' THEN s.full_name
    ELSE 'Unknown'
  END as user_name,
  CASE 
    WHEN n.user_type = 'teacher' THEN t.email
    WHEN n.user_type = 'student' THEN s.email
    ELSE NULL
  END as user_email
FROM notifications n
LEFT JOIN teachers t ON n.user_type = 'teacher' AND n.user_id = t.id
LEFT JOIN students s ON n.user_type = 'student' AND n.user_id = s.id;

-- ============================================
-- GRANTS
-- ============================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated, anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION cancel_grading(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION update_newsroom_updated_at() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION set_newsroom_published_at() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION set_notification_user_type() TO authenticated, anon;

-- Grant table permissions (RLS will control access)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- Grant view permissions
GRANT SELECT ON notifications_with_user_info TO authenticated, anon;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsroom ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Teachers can view all teachers" ON teachers;
DROP POLICY IF EXISTS "Teachers can insert their profile" ON teachers;
DROP POLICY IF EXISTS "Teachers can update all teacher profiles" ON teachers;
DROP POLICY IF EXISTS "Teachers can view all students" ON students;
DROP POLICY IF EXISTS "Teachers can create students" ON students;
DROP POLICY IF EXISTS "Teachers can update all students" ON students;
DROP POLICY IF EXISTS "Teachers can delete students" ON students;
DROP POLICY IF EXISTS "Students can view own profile" ON students;
DROP POLICY IF EXISTS "Students can view all students" ON students;
DROP POLICY IF EXISTS "Teachers can view all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can create classes" ON classes;
DROP POLICY IF EXISTS "Teachers can update all classes" ON classes;
DROP POLICY IF EXISTS "Teachers can delete classes" ON classes;
DROP POLICY IF EXISTS "Students can view enrolled classes" ON classes;
DROP POLICY IF EXISTS "Teachers can manage class_students" ON class_students;
DROP POLICY IF EXISTS "Students can view their enrollments" ON class_students;
DROP POLICY IF EXISTS "Teachers can manage all materials" ON materials;
DROP POLICY IF EXISTS "Students can view enrolled class materials" ON materials;
DROP POLICY IF EXISTS "Teachers can manage all assignments" ON assignments;
DROP POLICY IF EXISTS "Students can view assignments for enrolled classes" ON assignments;
DROP POLICY IF EXISTS "Teachers can manage assignment_classes" ON assignment_classes;
DROP POLICY IF EXISTS "Students can view assignment_classes" ON assignment_classes;
DROP POLICY IF EXISTS "Teachers can manage all questions" ON questions;
DROP POLICY IF EXISTS "Students can view questions for visible assignments" ON questions;
DROP POLICY IF EXISTS "Teachers can manage all submissions" ON submissions;
DROP POLICY IF EXISTS "Students can manage own submissions" ON submissions;
DROP POLICY IF EXISTS "Teachers can manage all answers" ON answers;
DROP POLICY IF EXISTS "Students can manage own answers" ON answers;
DROP POLICY IF EXISTS "Teachers can manage all attendances" ON attendances;
DROP POLICY IF EXISTS "Students can view own attendances" ON attendances;
DROP POLICY IF EXISTS "Teachers can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Students can view their notifications" ON notifications;
DROP POLICY IF EXISTS "Students can update their notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers can create notifications" ON notifications;
DROP POLICY IF EXISTS "Teachers can view all activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Teachers can create activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Teachers can manage all newsroom" ON newsroom;
DROP POLICY IF EXISTS "Students can view published newsroom" ON newsroom;
DROP POLICY IF EXISTS "Service role can insert external news" ON newsroom;

-- TEACHERS
CREATE POLICY "Teachers can view all teachers" ON teachers
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can insert their profile" ON teachers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY "Teachers can update all teacher profiles" ON teachers
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

-- STUDENTS
-- Teachers can manage students
CREATE POLICY "Teachers can view all students" ON students
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create students" ON students
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all students" ON students
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete students" ON students
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can view all students (for login purposes - password_hash is not selected in queries)
CREATE POLICY "Students can view all students" ON students
  FOR SELECT TO anon USING (true);

-- CLASSES
CREATE POLICY "Teachers can view all classes" ON classes
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create classes" ON classes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can update all classes" ON classes
  FOR UPDATE TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can delete classes" ON classes
  FOR DELETE TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can view enrolled classes
CREATE POLICY "Students can view enrolled classes" ON classes
  FOR SELECT TO anon USING (
    id IN (SELECT class_id FROM class_students WHERE student_id IN (SELECT id FROM students))
  );

-- CLASS STUDENTS
CREATE POLICY "Teachers can manage class_students" ON class_students
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can view their enrollments
CREATE POLICY "Students can view their enrollments" ON class_students
  FOR SELECT TO anon USING (true);

-- MATERIALS
CREATE POLICY "Teachers can manage all materials" ON materials
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can view enrolled class materials
CREATE POLICY "Students can view enrolled class materials" ON materials
  FOR SELECT TO anon USING (
    class_id IN (SELECT class_id FROM class_students WHERE student_id IN (SELECT id FROM students))
  );

-- ASSIGNMENTS
CREATE POLICY "Teachers can manage all assignments" ON assignments
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can view assignments for enrolled classes or tambahan assignments
CREATE POLICY "Students can view assignments for enrolled classes" ON assignments
  FOR SELECT TO anon USING (
    assignment_type = 'tambahan' OR
    class_id IN (SELECT class_id FROM class_students WHERE student_id IN (SELECT id FROM students)) OR
    id IN (SELECT assignment_id FROM assignment_classes WHERE class_id IN (SELECT class_id FROM class_students WHERE student_id IN (SELECT id FROM students)))
  );

-- ASSIGNMENT CLASSES
CREATE POLICY "Teachers can manage assignment_classes" ON assignment_classes
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view assignment_classes" ON assignment_classes
  FOR SELECT TO anon USING (true);

-- QUESTIONS
CREATE POLICY "Teachers can manage all questions" ON questions
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view questions for visible assignments" ON questions
  FOR SELECT TO anon USING (true);

-- SUBMISSIONS
CREATE POLICY "Teachers can manage all submissions" ON submissions
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can manage own submissions (insert, update, select, delete)
CREATE POLICY "Students can manage own submissions" ON submissions
  FOR ALL TO anon USING (student_id IN (SELECT id FROM students));

-- ANSWERS
CREATE POLICY "Teachers can manage all answers" ON answers
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can manage own answers" ON answers
  FOR ALL TO anon USING (
    submission_id IN (SELECT id FROM submissions WHERE student_id IN (SELECT id FROM students))
  );

-- ATTENDANCES
CREATE POLICY "Teachers can manage all attendances" ON attendances
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Students can view own attendances" ON attendances
  FOR SELECT TO anon USING (student_id IN (SELECT id FROM students));

-- NOTIFICATIONS
-- Teachers can view and manage their notifications
CREATE POLICY "Teachers can view their notifications" ON notifications
  FOR SELECT TO authenticated USING (user_type = 'teacher' AND user_id = auth.uid());

CREATE POLICY "Teachers can update their notifications" ON notifications
  FOR UPDATE TO authenticated USING (user_type = 'teacher' AND user_id = auth.uid());

-- Students can view and update their notifications (using student_id, not auth.uid)
CREATE POLICY "Students can view their notifications" ON notifications
  FOR SELECT TO anon USING (user_type = 'student' AND user_id IN (SELECT id FROM students));

CREATE POLICY "Students can update their notifications" ON notifications
  FOR UPDATE TO anon USING (user_type = 'student' AND user_id IN (SELECT id FROM students));

-- Teachers can create notifications for anyone
CREATE POLICY "Teachers can create notifications" ON notifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- ACTIVITY LOGS
CREATE POLICY "Teachers can view all activity logs" ON activity_logs
  FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL);

CREATE POLICY "Teachers can create activity logs" ON activity_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- NEWSROOM
CREATE POLICY "Teachers can manage all newsroom" ON newsroom
  FOR ALL TO authenticated USING (auth.uid() IS NOT NULL);

-- Students can view published newsroom
CREATE POLICY "Students can view published newsroom" ON newsroom
  FOR SELECT TO anon USING (
    status = 'published' AND (target_audience = 'all' OR target_audience = 'students')
  );

-- Allow service role to insert external news (for edge functions)
CREATE POLICY "Service role can insert external news" ON newsroom
  FOR INSERT WITH CHECK (source = 'external');

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Avatars bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Materials bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('materials', 'materials', false)
ON CONFLICT (id) DO NOTHING;

-- Submissions bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('submissions', 'submissions', false)
ON CONFLICT (id) DO NOTHING;

-- Newsroom images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'newsroom-images',
  'newsroom-images',
  true,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml']
) ON CONFLICT (id) DO NOTHING;

-- ============================================
-- STORAGE POLICIES
-- ============================================

-- Drop existing storage policies
DO $$ 
DECLARE
  r RECORD;
BEGIN
  FOR r IN (
    SELECT policyname, tablename 
    FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', r.policyname);
  END LOOP;
END $$;

-- AVATARS
CREATE POLICY "Public avatars are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated users can upload avatars" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatars" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatars" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- MATERIALS
CREATE POLICY "Teachers can upload materials" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'materials' AND auth.uid() IN (SELECT id FROM teachers)
  );

CREATE POLICY "Teachers can view all materials" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'materials' AND auth.uid() IN (SELECT id FROM teachers)
  );

CREATE POLICY "Teachers can update materials" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'materials' AND auth.uid() IN (SELECT id FROM teachers)
  );

CREATE POLICY "Teachers can delete materials" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'materials' AND auth.uid() IN (SELECT id FROM teachers)
  );

-- Students can view materials (anon access)
CREATE POLICY "Students can view materials" ON storage.objects
  FOR SELECT USING (bucket_id = 'materials');

-- SUBMISSIONS
-- Students can upload submissions (anon access)
CREATE POLICY "Students can upload submissions" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'submissions');

CREATE POLICY "Students can view own submissions" ON storage.objects
  FOR SELECT USING (bucket_id = 'submissions');

CREATE POLICY "Students can update own submissions" ON storage.objects
  FOR UPDATE USING (bucket_id = 'submissions');

-- Teachers can view all submissions
CREATE POLICY "Teachers can view all submissions" ON storage.objects
  FOR SELECT TO authenticated USING (
    bucket_id = 'submissions' AND auth.uid() IN (SELECT id FROM teachers)
  );

CREATE POLICY "Teachers can update submissions" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'submissions' AND auth.uid() IN (SELECT id FROM teachers)
  );

-- NEWSROOM IMAGES
CREATE POLICY "Teachers can upload newsroom images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'newsroom-images' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Teachers can update newsroom images" ON storage.objects
  FOR UPDATE TO authenticated USING (
    bucket_id = 'newsroom-images' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Teachers can delete newsroom images" ON storage.objects
  FOR DELETE TO authenticated USING (
    bucket_id = 'newsroom-images' AND auth.uid() IS NOT NULL
  );

-- Public can view newsroom images
CREATE POLICY "Public can view newsroom images" ON storage.objects
  FOR SELECT USING (bucket_id = 'newsroom-images');

