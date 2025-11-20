# API Request & Response Flow - LMS Project

Dokumen ini menjelaskan bagian REST API dalam proyek LMS (Learning Management System), termasuk alur request dan response menggunakan Supabase sebagai backend.

## Arsitektur API

### Backend Service
- **Platform**: Supabase (PostgreSQL + Real-time subscriptions)
- **Authentication**: Supabase Auth (JWT tokens)
- **Database**: PostgreSQL dengan Row Level Security (RLS)
- **File Storage**: Supabase Storage untuk upload files
- **Real-time**: Supabase Realtime untuk live updates

### Client Library
- **Supabase JS Client**: `@supabase/supabase-js`
- **Configuration**: Environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)

---

## Alur Request & Response

### 1. Authentication Flow

#### Teacher Login
```typescript
// Request
const { data, error } = await supabase.auth.signInWithPassword({
  email: "teacher@example.com",
  password: "password123"
});

// Response Success
{
  data: {
    user: {
      id: "uuid-teacher-123",
      email: "teacher@example.com",
      user_metadata: { full_name: "John Doe" }
    },
    session: { access_token: "jwt-token", refresh_token: "refresh-token" }
  },
  error: null
}

// Response Error
{
  data: null,
  error: { message: "Invalid login credentials" }
}
```

#### Student Login (Custom Auth)
```typescript
// Request - Custom authentication (not Supabase Auth)
const student = await studentAuthService.loginStudent(email, password);

// Response Success
{
  id: "uuid-student-123",
  email: "student@example.com",
  full_name: "Jane Smith",
  birth_date: "2005-05-15",
  is_active: true
}

// Response Error
throw new Error("Invalid credentials");
```

### 2. CRUD Operations

#### Create Class
```typescript
// Request
const { data, error } = await supabase
  .from('classes')
  .insert({
    name: "Matematika Kelas 10A",
    grade: "10",
    description: "Kelas matematika dasar",
    class_code: "MATH10A",
    created_by: "uuid-teacher-123"
  })
  .select()
  .single();

// Response Success
{
  data: {
    id: "uuid-class-123",
    name: "Matematika Kelas 10A",
    grade: "10",
    class_code: "MATH10A",
    is_active: true,
    created_at: "2025-01-25T10:00:00Z"
  },
  error: null
}
```

#### Read Classes with Relations
```typescript
// Request - Get all classes with teacher and student count
const { data, error } = await supabase
  .from('classes')
  .select(`
    *,
    created_by_teacher:teachers!classes_created_by_fkey(full_name),
    class_students(count)
  `)
  .order('created_at', { ascending: false });

// Response Success
{
  data: [
    {
      id: "uuid-class-123",
      name: "Matematika Kelas 10A",
      grade: "10",
      created_by_teacher: { full_name: "John Doe" },
      class_students: [{ count: 25 }],
      student_count: 25
    }
  ],
  error: null
}
```

#### Update Assignment
```typescript
// Request
const { data, error } = await supabase
  .from('assignments')
  .update({
    title: "Updated Assignment Title",
    deadline: "2025-02-01T23:59:59Z",
    updated_at: new Date().toISOString()
  })
  .eq('id', 'uuid-assignment-123')
  .select()
  .single();

// Response Success
{
  data: {
    id: "uuid-assignment-123",
    title: "Updated Assignment Title",
    deadline: "2025-02-01T23:59:59Z",
    updated_at: "2025-01-25T15:30:00Z"
  },
  error: null
}
```

#### Delete with Cascade Effect
```typescript
// Request - Delete class (triggers cascade deletes)
const { error } = await supabase
  .from('classes')
  .delete()
  .eq('id', 'uuid-class-123');

// Response Success
{
  error: null
}
// Note: Related records in class_students, assignments, etc. are deleted via DB constraints
```

### 3. Complex Queries with Joins

#### Get Assignment with Full Details
```typescript
// Request
const { data, error } = await supabase
  .from('assignments')
  .select(`
    *,
    class:classes(id, name, grade),
    assignment_classes(
      class_id,
      class:classes(id, name, grade)
    ),
    questions(count),
    submissions(count)
  `)
  .eq('id', 'uuid-assignment-123')
  .single();

// Response Success
{
  data: {
    id: "uuid-assignment-123",
    title: "Mathematics Quiz",
    class: { id: "uuid-class-123", name: "Math 10A", grade: "10" },
    assignment_classes: [
      {
        class_id: "uuid-class-123",
        class: { id: "uuid-class-123", name: "Math 10A", grade: "10" }
      }
    ],
    questions: [{ count: 5 }],
    submissions: [{ count: 23 }]
  },
  error: null
}
```

### 4. Bulk Operations

#### Bulk Update Assignments
```typescript
// Request
const { error } = await supabase
  .from('assignments')
  .update({
    deadline: "2025-02-15T23:59:59Z",
    updated_at: new Date().toISOString()
  })
  .in('id', ['uuid-1', 'uuid-2', 'uuid-3']);

// Response Success
{
  error: null
}
// Note: Updates all specified assignments
```

#### Bulk Insert Submissions
```typescript
// Request - Distribute assignment to multiple students
const submissions = studentIds.map(studentId => ({
  assignment_id: 'uuid-assignment-123',
  student_id: studentId,
  status: 'pending'
}));

const { error } = await supabase
  .from('submissions')
  .insert(submissions);

// Response Success
{
  error: null
}
```

### 5. File Upload Operations

#### Upload Assignment File
```typescript
// Request
const { data, error } = await supabase.storage
  .from('assignments')
  .upload(`assignment-${assignmentId}/${fileName}`, file, {
    cacheControl: '3600',
    upsert: false
  });

// Response Success
{
  data: {
    path: "assignment-123/document.pdf",
    fullPath: "assignments/assignment-123/document.pdf",
    id: "file-uuid"
  },
  error: null
}
```

### 6. Real-time Subscriptions

#### Listen to Assignment Updates
```typescript
// Request - Subscribe to changes
const subscription = supabase
  .channel('assignments')
  .on('postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'assignments'
    },
    (payload) => {
      console.log('Assignment changed:', payload);
      // Handle real-time updates
    }
  )
  .subscribe();

// Response - Real-time events
{
  eventType: "UPDATE",
  new: { id: "uuid-123", title: "Updated Title" },
  old: { id: "uuid-123", title: "Old Title" }
}
```

---

## Error Handling Patterns

### Database Errors
```typescript
try {
  const { data, error } = await supabase.from('table').select('*');
  if (error) throw error;
  return data;
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch data');
}
```

### Authentication Errors
```typescript
try {
  const { data, error } = await supabase.auth.signInWithPassword(credentials);
  if (error) throw error;
  return data;
} catch (error) {
  // Handle specific auth errors
  if (error.message.includes('Invalid login credentials')) {
    throw new Error('Email atau password salah');
  }
  throw error;
}
```

### Network Errors
```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (!navigator.onLine) {
    throw new Error('Tidak ada koneksi internet');
  }
  throw new Error('Terjadi kesalahan jaringan');
}
```

---

## Security Features

### Row Level Security (RLS)
- Semua tabel menggunakan RLS policies
- Users hanya bisa akses data mereka sendiri
- Teachers bisa akses data kelas dan siswa mereka
- Students hanya bisa akses assignment mereka

### Authentication Guards
```typescript
// Check if user is authenticated
const { data: { user } } = await supabase.auth.getUser();
if (!user) throw new Error('Authentication required');

// Check user role
const { data: teacher } = await supabase
  .from('teachers')
  .select('*')
  .eq('id', user.id)
  .single();
```

### Input Validation
- Server-side validation via database constraints
- Client-side validation sebelum API calls
- Sanitization untuk user inputs

---

## Performance Optimizations

### Query Optimization
- Select hanya fields yang diperlukan
- Gunakan joins yang efisien
- Implementasi pagination untuk large datasets
- Indexing pada frequently queried columns

### Caching Strategy
- Browser caching untuk static assets
- Supabase real-time untuk live updates
- Local state management untuk UI responsiveness

### Batch Operations
- Bulk insert/update untuk multiple records
- Transaction grouping untuk related operations
- Debounced API calls untuk search/filter

---

## API Endpoints Summary

| Entity | Operations | Authentication |
|--------|------------|----------------|
| Teachers | signInWithPassword, getUser, signOut | Supabase Auth |
| Students | loginStudent, createStudent, updateStudent | Custom Auth |
| Classes | CRUD + enrollStudent, unenrollStudent | Teacher only |
| Assignments | CRUD + bulk operations, distribute | Teacher only |
| Submissions | CRUD + bulk grading | Teacher/Student |
| Files | upload, download, delete | Authenticated users |

---

*Generated on: 2025-10-25*
*API Version: Supabase v2*
*Database: PostgreSQL 15*