-- UniPilot PostgreSQL Schema
-- Run automatically by initDb() on server start

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  terms_accepted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS catalog_courses (
  id SERIAL PRIMARY KEY,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  department TEXT NOT NULL,
  description TEXT,
  credit_hours INTEGER NOT NULL DEFAULT 3,
  "order" INTEGER NOT NULL DEFAULT 1,
  prerequisite_id INTEGER REFERENCES catalog_courses(id),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  catalog_course_id INTEGER REFERENCES catalog_courses(id),
  course_name TEXT NOT NULL,
  course_code TEXT NOT NULL,
  credit_hours INTEGER NOT NULL DEFAULT 3,
  semester TEXT DEFAULT 'Spring 2026',
  difficulty INTEGER DEFAULT 5,
  target_grade REAL DEFAULT 85,
  professor_name TEXT,
  description TEXT,
  current_grade REAL,
  progress REAL DEFAULT 0,
  finalized_at TIMESTAMPTZ,
  passed INTEGER,
  semester_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, catalog_course_id)
);

CREATE INDEX IF NOT EXISTS idx_student_courses_user ON student_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_student_courses_catalog ON student_courses(catalog_course_id);
CREATE INDEX IF NOT EXISTS idx_catalog_order ON catalog_courses("order");
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS grade_items (
  id SERIAL PRIMARY KEY,
  student_course_id INTEGER NOT NULL REFERENCES student_courses(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'quiz',
  title TEXT NOT NULL,
  score REAL NOT NULL DEFAULT 0,
  max_score REAL NOT NULL DEFAULT 100,
  weight REAL NOT NULL DEFAULT 0,
  from_scheme INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_grade_items_student_course ON grade_items(student_course_id);

CREATE TABLE IF NOT EXISTS catalog_grade_items (
  id SERIAL PRIMARY KEY,
  catalog_course_id INTEGER NOT NULL REFERENCES catalog_courses(id) ON DELETE CASCADE,
  item_type TEXT NOT NULL DEFAULT 'quiz',
  title TEXT NOT NULL,
  weight REAL NOT NULL DEFAULT 0,
  max_score REAL DEFAULT 100,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_catalog_grade_items_course ON catalog_grade_items(catalog_course_id);

CREATE TABLE IF NOT EXISTS notes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_course_id INTEGER REFERENCES student_courses(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'student' CHECK (type IN ('student', 'app')),
  note_category TEXT,
  ref_id INTEGER,
  ref_type TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_type ON notes(type);

CREATE TABLE IF NOT EXISTS student_academic_record (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cgpa REAL DEFAULT 0,
  cumulative_percent REAL DEFAULT 0,
  total_credits_completed REAL DEFAULT 0,
  total_credits_carried REAL DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS planner_events (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_course_id INTEGER REFERENCES student_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'study' CHECK (event_type IN ('exam', 'study', 'project', 'other')),
  completed INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_planner_events_user ON planner_events(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_events_dates ON planner_events(start_date, end_date);

CREATE TABLE IF NOT EXISTS planner_tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_course_id INTEGER REFERENCES student_courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  due_date TEXT NOT NULL,
  due_time TEXT,
  priority INTEGER NOT NULL DEFAULT 3,
  completed INTEGER DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'student' CHECK (source IN ('app', 'student')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_user ON planner_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_due ON planner_tasks(due_date);

CREATE TABLE IF NOT EXISTS course_modules (
  id SERIAL PRIMARY KEY,
  student_course_id INTEGER NOT NULL REFERENCES student_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS course_module_items (
  id SERIAL PRIMARY KEY,
  course_module_id INTEGER NOT NULL REFERENCES course_modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'file' CHECK (type IN ('folder', 'file')),
  title TEXT NOT NULL,
  url_or_content TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_course_modules_student_course ON course_modules(student_course_id);
CREATE INDEX IF NOT EXISTS idx_course_module_items_module ON course_module_items(course_module_id);

CREATE TABLE IF NOT EXISTS catalog_resources (
  id SERIAL PRIMARY KEY,
  catalog_course_id INTEGER NOT NULL REFERENCES catalog_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_catalog_resources_course ON catalog_resources(catalog_course_id);

CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS course_chat_messages (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_course_id INTEGER NOT NULL REFERENCES student_courses(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_ai_chat_sessions_user ON ai_chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_session ON ai_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_course_chat_messages_course ON course_chat_messages(user_id, student_course_id);

CREATE TABLE IF NOT EXISTS study_documents (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT,
  file_type TEXT,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS study_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'text',
  source_id INTEGER,
  title TEXT,
  content TEXT NOT NULL,
  lang TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS study_flashcard_sets (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'text',
  source_id INTEGER,
  title TEXT,
  lang TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS study_flashcards (
  id SERIAL PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES study_flashcard_sets(id) ON DELETE CASCADE,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS study_quizzes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'text',
  source_id INTEGER,
  title TEXT,
  difficulty TEXT DEFAULT 'medium',
  question_type TEXT DEFAULT 'multiple_choice',
  question_count INTEGER NOT NULL,
  source_scope TEXT DEFAULT 'within',
  lang TEXT DEFAULT 'ar',
  questions_json TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS study_quiz_attempts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id INTEGER NOT NULL REFERENCES study_quizzes(id) ON DELETE CASCADE,
  answers_json TEXT,
  score_real INTEGER NOT NULL,
  score_max INTEGER NOT NULL,
  feedback_text TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS study_mind_maps (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'text',
  source_id INTEGER,
  title TEXT,
  content_json TEXT NOT NULL,
  lang TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_study_documents_user ON study_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_study_summaries_user ON study_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_study_flashcard_sets_user ON study_flashcard_sets(user_id);
CREATE INDEX IF NOT EXISTS idx_study_flashcards_set ON study_flashcards(set_id);
CREATE INDEX IF NOT EXISTS idx_study_quizzes_user ON study_quizzes(user_id);
CREATE INDEX IF NOT EXISTS idx_study_quiz_attempts_user ON study_quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_study_mind_maps_user ON study_mind_maps(user_id);

CREATE TABLE IF NOT EXISTS voice_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Voice session',
  transcript TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  summary TEXT,
  source TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'upload')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_user ON voice_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_created ON voice_sessions(created_at DESC);

CREATE TABLE IF NOT EXISTS student_semesters (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_current INTEGER NOT NULL DEFAULT 0,
  app_rating TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_student_semesters_user ON student_semesters(user_id);

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  read_at TIMESTAMPTZ,
  link TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at);

CREATE TABLE IF NOT EXISTS notification_broadcasts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success')),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notification_broadcasts_user ON notification_broadcasts(user_id);
