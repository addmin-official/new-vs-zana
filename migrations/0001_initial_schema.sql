-- Students table
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY,
  firebase_uid TEXT UNIQUE NOT NULL,
  name TEXT,
  grade TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Learning records
CREATE TABLE IF NOT EXISTS learning_records (
  id TEXT PRIMARY KEY,
  student_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  lesson TEXT,
  score INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id)
);

CREATE INDEX idx_students_firebase_uid ON students(firebase_uid);
CREATE INDEX idx_learning_records_student ON 
learning_records(student_id);
