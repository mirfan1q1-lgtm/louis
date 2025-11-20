/**
 * Komponen UnifiedLogin
 *
 * Komponen ini menyediakan antarmuka login terpadu untuk guru dan siswa
 * dalam Sistem Manajemen Pembelajaran (LMS). Fitur terminal-style UI dengan
 * efek animasi mengetik dan styling seperti kode untuk pengalaman developer yang imersif.
 *
 * Fitur:
 * - Autentikasi dual role (Guru/Siswa)
 * - Antarmuka terminal animasi dengan efek mengetik
 * - Penanganan error dan state loading
 * - Desain responsif dengan komponen Mantine UI
 * - Navigasi ke dashboard masing-masing setelah login berhasil
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Title,
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Text,
  Tabs,
  Alert,
  Group,
  Box,
  Code,
  Badge,
} from '@mantine/core';
import {
  Terminal,
  Code2,
  AlertCircle,
  Mail,
  Lock,
  User,
  Shield,
  Database,
  Cpu,
  GitBranch,
  ChevronRight
} from 'lucide-react';
import { useUnifiedAuth } from '../../contexts/UnifiedAuthContext';
import { useSEO } from '../../hooks/useSEO';
import './UnifiedLogin.css';

export default function UnifiedLogin() {
  useSEO({
    title: 'Login',
    description: 'Masuk ke LOUIS (Louise) LMS di louise.my.id. Akses dashboard guru dan siswa dalam satu platform pembelajaran digital.',
    keywords: 'login LOUIS, login Louise LMS, louis lms, louise lms, masuk LMS guru, masuk LMS siswa, autentikasi louise.my.id',
  });
  const navigate = useNavigate();
  const { loginTeacher, loginStudent, loading } = useUnifiedAuth();

  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherError, setTeacherError] = useState('');

  const [studentEmail, setStudentEmail] = useState('');
  const [studentPassword, setStudentPassword] = useState('');
  const [studentError, setStudentError] = useState('');

  // State management untuk efek animasi terminal
  const [typingText, setTypingText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [currentLine, setCurrentLine] = useState(0);

  // useEffect untuk animasi mengetik terminal
  useEffect(() => {
    // Array baris terminal yang akan ditampilkan secara bertahap
    const terminalLines = [
      '> Initializing LOUIS System...',
      '> Loading authentication modules...',
      '> Connecting to database...',
      '> System ready. Welcome to LOUIS v3.0',
      '> Select your role to continue:'
    ];

    // Fungsi untuk mengetik teks secara bertahap
    const typeText = () => {
      if (currentLine < terminalLines.length) {
        const currentText = terminalLines[currentLine];
        if (typingText.length < currentText.length) {
          setTypingText(currentText.slice(0, typingText.length + 1));
        } else {
          // Pindah ke baris berikutnya setelah delay 1 detik
          setTimeout(() => {
            setCurrentLine(currentLine + 1);
            setTypingText('');
          }, 1000);
        }
      }
    };

    // Timer untuk efek mengetik (50ms per karakter)
    const timer = setTimeout(typeText, 50);
    return () => clearTimeout(timer);
  }, [typingText, currentLine]);

  // useEffect untuk animasi kursor berkedip
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 500);
    return () => clearInterval(cursorTimer);
  }, []);

  /**
   * Handler untuk login guru
   * @param e - Event form submit
   */
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setTeacherError(''); // Reset error sebelumnya

    try {
      // Panggil fungsi login dari context autentikasi
      await loginTeacher(teacherEmail, teacherPassword);
      // Navigasi ke dashboard guru jika berhasil
      navigate('/teacher/dashboard');
    } catch (err: unknown) {
      // Tangani error dan tampilkan pesan
      const error = err as Error;
      setTeacherError(error.message || 'Gagal login sebagai guru');
    }
  };

  /**
   * Handler untuk login siswa
   * @param e - Event form submit
   */
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault(); // Mencegah reload halaman
    setStudentError(''); // Reset error sebelumnya

    try {
      // Panggil fungsi login dari context autentikasi
      await loginStudent(studentEmail, studentPassword);
      // Navigasi ke dashboard siswa jika berhasil
      navigate('/student/dashboard');
    } catch (err: unknown) {
      // Tangani error dan tampilkan pesan
      const error = err as Error;
      setStudentError(error.message || 'Gagal login sebagai siswa');
    }
  };

  return (
    // Container utama dengan background programmer theme
    <Box className="programmer-container">
      {/* Elemen background terminal untuk efek visual */}
      <div className="terminal-grid"></div>
      <div className="code-particles"></div>
      <div className="binary-rain"></div>

      {/* Container utama dengan layout responsif */}
      <Container size={1200} py={80} style={{ position: 'relative', zIndex: 1 }} className="main-container">
        {/* Layout dengan dua panel: terminal kiri, form kanan */}
        <Group align="flex-start" gap="xl" className="login-layout">
          {/* Panel Kiri - Antarmuka Terminal */}
          <Box className="terminal-panel">
            {/* Window terminal dengan styling seperti terminal sesungguhnya */}
            <Paper className="terminal-window" p="xl" radius="md">
              {/* Header Terminal - meniru window macOS */}
              <Group justify="space-between" mb="md" className="terminal-header">
                {/* Tombol kontrol window (merah, kuning, hijau) */}
                <Group gap="xs">
                  <div className="terminal-button red"></div>
                  <div className="terminal-button yellow"></div>
                  <div className="terminal-button green"></div>
                </Group>
                {/* Judul terminal */}
                <Text size="sm" c="gray.5" className="terminal-title">
                  LOUIS Terminal v3.0
                </Text>
                {/* Icon terminal dan kode */}
                <Group gap="xs">
                  <Terminal size={16} color="#10b981" />
                  <Code2 size={16} color="#3b82f6" />
                </Group>
              </Group>

              {/* Konten Terminal - area utama terminal */}
              <Box className="terminal-content">
                {/* Stack untuk menampilkan baris terminal secara bertahap */}
                <Stack gap="xs">
                  {/* Baris pertama - animasi mengetik */}
                  <Group gap="xs">
                    {/* Prompt terminal */}
                    <Text size="sm" c="green.4" className="terminal-prompt">
                      root@louis:~$
                    </Text>
                    {/* Teks yang sedang diketik dengan kursor */}
                    <Text size="sm" c="white" className="terminal-text">
                      {typingText}
                      {showCursor && <span className="terminal-cursor">_</span>}
                    </Text>
                  </Group>

                  {/* Baris kedua - muncul setelah baris pertama selesai */}
                  {currentLine > 0 && (
                    <Group gap="xs">
                      <Text size="sm" c="green.4" className="terminal-prompt">
                        root@louis:~$
                      </Text>
                      <Text size="sm" c="blue.3" className="terminal-text">
                        ./louis --version
                      </Text>
                    </Group>
                  )}

                  {/* Output versi LOUIS */}
                  {currentLine > 1 && (
                    <Text size="sm" c="gray.4" className="terminal-output">
                      LOUIS - v3.0.0
                    </Text>
                  )}

                  {/* Output teknologi yang digunakan */}
                  {currentLine > 2 && (
                    <Text size="sm" c="gray.4" className="terminal-output">
                      Built with React + TypeScript + Supabase
                    </Text>
                  )}

                  {/* Baris perintah cek status auth */}
                  {currentLine > 3 && (
                    <Group gap="xs">
                      <Text size="sm" c="green.4" className="terminal-prompt">
                        root@louis:~$
                      </Text>
                      <Text size="sm" c="yellow.4" className="terminal-text">
                        ./auth --status
                      </Text>
                    </Group>
                  )}

                  {/* Output status autentikasi */}
                  {currentLine > 4 && (
                    <Text size="sm" c="green.4" className="terminal-output">
                      ✓ Authentication service online
                    </Text>
                  )}

                  {/* Baris perintah whoami */}
                  {currentLine > 4 && (
                    <Group gap="xs" mt="md">
                      <Text size="sm" c="green.4" className="terminal-prompt">
                        root@louis:~$
                      </Text>
                      <Text size="sm" c="blue.3" className="terminal-text">
                        whoami
                      </Text>
                    </Group>
                  )}

                  {/* Output nama developer */}
                  {currentLine > 4 && (
                    <Text size="sm" c="yellow.4" className="terminal-output">
                      MUHAMMAD IRFAN
                    </Text>
                  )}

                  {/* Output deskripsi developer */}
                  {currentLine > 4 && (
                    <Text size="sm" c="gray.4" className="terminal-output">
                      Full Stack Developer & System Architect
                    </Text>
                  )}
                </Stack>
              </Box>

              {/* Info Sistem - menampilkan status sistem secara real-time */}
              <Box className="system-info" mt="lg">
                {/* Header status sistem */}
                <Group justify="space-between" mb="sm">
                  <Text size="xs" c="gray.5" className="monospace">
                    SYSTEM STATUS
                  </Text>
                  {/* Badge status online */}
                  <Badge size="xs" color="green" variant="dot">
                    ONLINE
                  </Badge>
                </Group>
                {/* Detail metrik sistem */}
                <Stack gap="xs">
                  {/* CPU usage */}
                  <Group justify="space-between">
                    <Text size="xs" c="gray.4" className="monospace">CPU:</Text>
                    <Text size="xs" c="green.4" className="monospace">12%</Text>
                  </Group>
                  {/* RAM usage */}
                  <Group justify="space-between">
                    <Text size="xs" c="gray.4" className="monospace">RAM:</Text>
                    <Text size="xs" c="blue.4" className="monospace">2.1GB</Text>
                  </Group>
                  {/* Database connection */}
                  <Group justify="space-between">
                    <Text size="xs" c="gray.4" className="monospace">DB:</Text>
                    <Text size="xs" c="green.4" className="monospace">Connected</Text>
                  </Group>
                </Stack>
              </Box>
            </Paper>
          </Box>

          {/* Panel Kanan - Form Login */}
          <Box className="form-panel">
            {/* Window kode dengan styling seperti editor */}
            <Paper className="code-window" p="xl" radius="md">
              {/* Header Window Kode - meniru VS Code */}
              <Group justify="space-between" mb="lg" className="code-header">
                {/* Tombol kontrol window */}
                <Group gap="xs">
                  <div className="code-button red"></div>
                  <div className="code-button yellow"></div>
                  <div className="code-button green"></div>
                </Group>
                {/* Nama file yang sedang "diedit" */}
                <Text size="sm" c="gray.5" className="monospace">
                  auth.tsx
                </Text>
                {/* Icon database dan security */}
                <Group gap="xs">
                  <Database size={16} color="#8b5cf6" />
                  <Shield size={16} color="#f59e0b" />
                </Group>
              </Group>

              {/* Header Authentication dengan styling kode */}
              <Stack gap="lg" mb="xl">
                <Box>
                  <Group gap="xs" mb="xs">
                    {/* Icon CPU untuk tema teknologi */}
                    <Cpu size={20} color="#10b981" />
                    {/* Judul Authentication */}
                    <Title order={2} c="white" className="monospace">
                      AUTHENTICATION
                    </Title>
                  </Group>
                  {/* Komentar kode sebagai deskripsi */}
                  <Text c="gray.4" size="sm" className="monospace">
                    // Select your access level
                  </Text>
                </Box>
              </Stack>

              {/* Tabs untuk memilih role (Teacher/Student) */}
              <Tabs defaultValue="teacher" variant="pills">
                {/* List tab dengan styling pill */}
                <Tabs.List grow mb="xl" className="code-tabs">
                  {/* Tab Teacher */}
                  <Tabs.Tab
                    value="teacher"
                    leftSection={<User size={16} />}
                    className="code-tab"
                  >
                    <Code mr="xs" />
                    TEACHER
                  </Tabs.Tab>
                  {/* Tab Student */}
                  <Tabs.Tab
                    value="student"
                    leftSection={<Shield size={16} />}
                    className="code-tab"
                  >
                    <Code mr="xs" />
                    STUDENT
                  </Tabs.Tab>
                </Tabs.List>

                {/* Panel Form Login Teacher */}
                <Tabs.Panel value="teacher">
                  {/* Form login dengan handler khusus teacher */}
                  <form onSubmit={handleTeacherLogin}>
                    <Stack gap="lg">
                      {/* Alert error jika login gagal */}
                      {teacherError && (
                        <Alert
                          icon={<AlertCircle size={16} />}
                          className="code-alert"
                          radius="md"
                        >
                          <Text size="sm" className="monospace">
                            ERROR: {teacherError}
                          </Text>
                        </Alert>
                      )}

                      {/* Input Email Teacher */}
                      <Box>
                        {/* Label dengan syntax JavaScript */}
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            teacherEmail
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        {/* Input field untuk email */}
                        <TextInput
                          placeholder="guru@sekolah.com"
                          required
                          value={teacherEmail}
                          onChange={(e) => setTeacherEmail(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Mail size={16} color="#6b7280" />}
                        />
                      </Box>

                      {/* Input Password Teacher */}
                      <Box>
                        {/* Label dengan syntax JavaScript */}
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            teacherPassword
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        {/* Input field untuk password */}
                        <PasswordInput
                          placeholder="••••••••"
                          required
                          value={teacherPassword}
                          onChange={(e) => setTeacherPassword(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Lock size={16} color="#6b7280" />}
                        />
                      </Box>

                      {/* Button Submit Login */}
                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        size="md"
                        radius="md"
                        className="code-button-primary"
                        rightSection={<ChevronRight size={16} />}
                      >
                        <Terminal size={16} className="mr-2" />
                        EXECUTE LOGIN
                      </Button>
                    </Stack>
                  </form>
                </Tabs.Panel>

                {/* Panel Form Login Student */}
                <Tabs.Panel value="student">
                  {/* Form login dengan handler khusus student */}
                  <form onSubmit={handleStudentLogin}>
                    <Stack gap="lg">
                      {/* Alert error jika login gagal */}
                      {studentError && (
                        <Alert
                          icon={<AlertCircle size={16} />}
                          className="code-alert"
                          radius="md"
                        >
                          <Text size="sm" className="monospace">
                            ERROR: {studentError}
                          </Text>
                        </Alert>
                      )}

                      {/* Input Email Student */}
                      <Box>
                        {/* Label dengan syntax JavaScript */}
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            studentEmail
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        {/* Input field untuk email */}
                        <TextInput
                          placeholder="siswa@sekolah.com"
                          required
                          value={studentEmail}
                          onChange={(e) => setStudentEmail(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Mail size={16} color="#6b7280" />}
                        />
                      </Box>

                      {/* Input Password Student */}
                      <Box>
                        {/* Label dengan syntax JavaScript */}
                        <Group gap="xs" mb="xs">
                          <Text size="sm" c="green.4" className="monospace">
                            const
                          </Text>
                          <Text size="sm" c="blue.3" className="monospace">
                            studentPassword
                          </Text>
                          <Text size="sm" c="gray.4" className="monospace">
                            =
                          </Text>
                          <Text size="sm" c="yellow.4" className="monospace">
                            "
                          </Text>
                        </Group>
                        {/* Input field untuk password */}
                        <PasswordInput
                          placeholder="••••••••"
                          required
                          value={studentPassword}
                          onChange={(e) => setStudentPassword(e.target.value)}
                          radius="md"
                          size="md"
                          className="code-input"
                          leftSection={<Lock size={16} color="#6b7280" />}
                        />
                      </Box>

                      {/* Button Submit Login */}
                      <Button
                        type="submit"
                        fullWidth
                        loading={loading}
                        size="md"
                        radius="md"
                        className="code-button-secondary"
                        rightSection={<ChevronRight size={16} />}
                      >
                        <GitBranch size={16} className="mr-2" />
                        EXECUTE LOGIN
                      </Button>
                    </Stack>
                  </form>
                </Tabs.Panel>
              </Tabs>

              {/* Bagian Bantuan - panduan autentikasi */}
              <Paper className="code-help" p="md" radius="md" mt="xl">
                {/* Header panduan dengan icon kode */}
                <Group gap="xs" mb="sm">
                  <Code2 size={14} color="#10b981" />
                  <Text size="xs" c="green.4" className="monospace">
                    // AUTHENTICATION GUIDE
                  </Text>
                </Group>
                {/* Daftar panduan dalam format komentar kode */}
                <Stack gap="xs">
                  {/* Panduan untuk teacher */}
                  <Group gap="xs">
                    <Text size="xs" c="blue.3" className="monospace">//</Text>
                    <Text size="xs" c="gray.4" className="monospace">
                      TEACHER: Use registered email & password
                    </Text>
                  </Group>
                  {/* Panduan untuk student */}
                  <Group gap="xs">
                    <Text size="xs" c="purple.3" className="monospace">//</Text>
                    <Text size="xs" c="gray.4" className="monospace">
                      STUDENT: Default password is birthdate (DDMMYYYY)
                    </Text>
                  </Group>
                  {/* Kontak support */}
                  <Group gap="xs">
                    <Text size="xs" c="red.3" className="monospace">//</Text>
                    <Text size="xs" c="gray.4" className="monospace">
                      SUPPORT: Contact system administrator
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Paper>
          </Box>
        </Group>
      </Container>
    </Box>
  );
}