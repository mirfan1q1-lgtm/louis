import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Card,
  Badge,
  ActionIcon,
  SimpleGrid,
  Paper,
  Alert,
  Avatar,
  TextInput,
  Tabs,
  Progress,
  Divider,
  ThemeIcon,
  ScrollArea,
  Switch,
  Radio
} from '@mantine/core';
import { 
  IconArrowLeft,
  IconCalendar, 
  IconUsers,
  IconCheck,
  IconX,
  IconClock,
  IconStethoscope,
  IconFileText,
  IconHistory,
  IconTrendingUp,
  IconBolt,
  IconRefresh,
  IconDownload,
  IconSearch
} from '@tabler/icons-react';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { classService } from '../../services/classService';
import { attendanceService } from '../../services/attendanceService';
import { LoadingSpinner, EmptyState } from '../../components';
import { notifications } from '@mantine/notifications';
import { formatGrade } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function ClassAttendance() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [attendanceHistory, setAttendanceHistory] = useState<any[]>([]);
  const [fullAttendanceHistory, setFullAttendanceHistory] = useState<any[]>([]);
  const [attendanceHistoryByDate, setAttendanceHistoryByDate] = useState<Record<string, any[]>>({});
  const [expandedDate, setExpandedDate] = useState<string | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [attendanceStatuses, setAttendanceStatuses] = useState<Record<string, 'present' | 'absent' | 'sick' | 'permission'>>({});
  const [attendanceNotes, setAttendanceNotes] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<string>('today');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyAbsent, setShowOnlyAbsent] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  useEffect(() => {
    if (id) {
      loadData();
    }
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      
      // Load class data
      const classInfo = await classService.getClassById(id);

      // Get enrolled students (only active ones for attendance)
      const enrolledStudents = classInfo.class_students
        ?.map((cs: any) => cs.student)
        .filter((student: any) => student && student.is_active) || [];
      
      setClassData(classInfo);
      setStudents(enrolledStudents);
      // Attendance summary is calculated in real-time
      
      // Load attendance history
      await loadAttendanceHistory();
    } catch (error) {
      console.error('Error loading data:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data kelas',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendanceHistory = async () => {
    if (!id || !selectedDate) return;

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      const history = await attendanceService.getAttendanceByClassAndDate(id, dateStr);
      setAttendanceHistory(history || []);
    } catch (error) {
      console.error('Error loading attendance history:', error);
      setAttendanceHistory([]);
    }
  };

  const loadFullAttendanceHistory = async () => {
    if (!id) return;

    try {
      setLoadingHistory(true);
      // Get history for last 30 days
      const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const history = await attendanceService.getAttendanceHistory(id, startDate);
      setFullAttendanceHistory(history || []);
      
      // Group by date
      const groupedByDate: Record<string, any[]> = {};
      (history || []).forEach((attendance: any) => {
        const date = attendance.date;
        if (!groupedByDate[date]) {
          groupedByDate[date] = [];
        }
        groupedByDate[date].push(attendance);
      });
      
      setAttendanceHistoryByDate(groupedByDate);
    } catch (error) {
      console.error('Error loading full attendance history:', error);
      setFullAttendanceHistory([]);
      setAttendanceHistoryByDate({});
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadAttendanceAnalytics = async () => {
    if (!id) return;

    try {
      setLoadingAnalytics(true);
      // Get statistics for last 30 days
      const startDate = dayjs().subtract(30, 'days').format('YYYY-MM-DD');
      const endDate = dayjs().format('YYYY-MM-DD');
      const stats = await attendanceService.getClassAttendanceStatistics(id, startDate, endDate);
      setAttendanceStats(stats);
    } catch (error) {
      console.error('Error loading attendance analytics:', error);
      setAttendanceStats(null);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadAttendanceHistory();
    }
  }, [selectedDate, id]);

  useEffect(() => {
    if (activeTab === 'history' && id) {
      loadFullAttendanceHistory();
    } else if (activeTab === 'analytics' && id) {
      loadAttendanceAnalytics();
    }
  }, [activeTab, id]);


  const handleStatusChange = (studentId: string, status: 'present' | 'absent' | 'sick' | 'permission') => {
    const validStatuses = ['present', 'absent', 'sick', 'permission'];
    if (!validStatuses.includes(status)) {
      console.warn('Invalid attendance status:', status);
      return;
    }

    setAttendanceStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendanceNotes(prev => ({
      ...prev,
      [studentId]: note
    }));
  };



  const handleSubmitAttendance = async () => {
    if (!id || !selectedDate) {
      notifications.show({
        title: 'Error',
        message: 'Pilih tanggal terlebih dahulu',
        color: 'red',
      });
      return;
    }

    // Get all students with status
    const studentsWithStatus = Object.keys(attendanceStatuses);
    
    if (studentsWithStatus.length === 0) {
      notifications.show({
        title: 'Error',
        message: 'Pilih status absensi untuk minimal satu siswa',
        color: 'red',
      });
      return;
    }

    try {
      const dateStr = dayjs(selectedDate).format('YYYY-MM-DD');
      
      // Prepare attendance data for batch processing
      const attendanceData = studentsWithStatus.map(studentId => ({
        student_id: studentId,
        status: attendanceStatuses[studentId] as 'present' | 'absent' | 'sick' | 'permission',
        notes: attendanceNotes[studentId] || '',
      }));

      // Mark attendance using batch method
      await attendanceService.markAttendanceBatch(
        id,
        dateStr,
        attendanceData,
        teacher.id
      );

      notifications.show({
        title: 'Berhasil',
        message: `Absensi berhasil dicatat untuk ${studentsWithStatus.length} siswa`,
        color: 'green',
      });

      setAttendanceStatuses({});
      setAttendanceNotes({});
      
      // Refresh all data after saving
      await loadAttendanceHistory();
      
      // If history or analytics tab is active, refresh those too
      if (activeTab === 'history') {
        await loadFullAttendanceHistory();
        // Keep expanded date if it exists
        if (expandedDate) {
          // Date will remain expanded after refresh
        }
      } else if (activeTab === 'analytics') {
        await loadAttendanceAnalytics();
      }
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mencatat absensi',
        color: 'red',
      });
    }
  };

  const getAttendanceStatus = (studentId: string) => {
    const attendance = attendanceHistory.find(a => a.student_id === studentId);
    return attendance ? attendance.status : null;
  };

  const getAttendanceStatusFromForm = (studentId: string) => {
    return attendanceStatuses[studentId] || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'green';
      case 'absent': return 'red';
      case 'sick': return 'yellow';
      case 'permission': return 'blue';
      default: return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <IconCheck size={14} />;
      case 'absent': return <IconX size={14} />;
      case 'sick': return <IconStethoscope size={14} />;
      case 'permission': return <IconFileText size={14} />;
      default: return <IconClock size={14} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Hadir';
      case 'absent': return 'Tidak Hadir';
      case 'sick': return 'Sakit';
      case 'permission': return 'Izin';
      default: return 'Belum Absen';
    }
  };

  // Filter students based on search and show only absent
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (showOnlyAbsent) {
      const attendanceStatus = getAttendanceStatus(student.id);
      return matchesSearch && (attendanceStatus === null || attendanceStatus === 'absent');
    }
    
    return matchesSearch;
  });

  // Calculate statistics
  const todayStats = {
    total: students.length,
    present: attendanceHistory.filter(a => a.status === 'present').length,
    absent: attendanceHistory.filter(a => a.status === 'absent').length,
    sick: attendanceHistory.filter(a => a.status === 'sick').length,
    permission: attendanceHistory.filter(a => a.status === 'permission').length,
    notMarked: students.length - attendanceHistory.length
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data absensi..." />;
  }

  if (!classData) {
    return (
      <Container size="xl" py="xl">
        <EmptyState
          icon={IconCalendar}
          title="Kelas tidak ditemukan"
          description="Kelas yang Anda cari tidak ditemukan"
          actionLabel="Kembali ke Daftar Kelas"
          onAction={() => navigate('/teacher/classes')}
        />
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Group>
            <ActionIcon
              variant="subtle"
              onClick={() => navigate(`/teacher/classes/${id}`)}
            >
              <IconArrowLeft size={16} />
            </ActionIcon>
            <div>
              <Title order={1}>Absensi Kelas</Title>
              <Text c="dimmed">
                {classData.name} - {formatGrade(classData.grade)}
              </Text>
            </div>
          </Group>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconRefresh size={16} />}
              onClick={loadData}
            >
              Refresh
            </Button>
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              color="blue"
            >
              Export
            </Button>
          </Group>
        </Group>

        {/* Quick Stats */}
        <SimpleGrid cols={{ base: 2, sm: 6 }}>
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconUsers size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.total}</Text>
                <Text size="xs" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="green">
                <IconCheck size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.present}</Text>
                <Text size="xs" c="dimmed">Hadir</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="red">
                <IconX size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.absent}</Text>
                <Text size="xs" c="dimmed">Tidak Hadir</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="yellow">
                <IconStethoscope size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.sick}</Text>
                <Text size="xs" c="dimmed">Sakit</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="blue">
                <IconFileText size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.permission}</Text>
                <Text size="xs" c="dimmed">Izin</Text>
              </div>
            </Group>
          </Paper>
          
          <Paper p="md" withBorder radius="md">
            <Group gap="sm">
              <ThemeIcon size="lg" variant="light" color="gray">
                <IconClock size={20} />
              </ThemeIcon>
              <div>
                <Text size="lg" fw={700}>{todayStats.notMarked}</Text>
                <Text size="xs" c="dimmed">Belum Absen</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Progress Bar */}
        <Card withBorder radius="md">
          <Stack gap="md">
            <Group justify="space-between">
              <Text fw={600}>Progress Absensi Hari Ini</Text>
              <Text size="sm" c="dimmed">
                {attendanceHistory.length} dari {students.length} siswa
              </Text>
            </Group>
            <Progress 
              value={(attendanceHistory.length / students.length) * 100} 
              size="lg" 
              radius="md"
              color="green"
            />
            <Text size="sm" c="dimmed" ta="center">
              {Math.round((attendanceHistory.length / students.length) * 100)}% selesai
            </Text>
          </Stack>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'today')}>
          <Tabs.List>
            <Tabs.Tab value="today" leftSection={<IconCalendar size={16} />}>
              Absensi Hari Ini
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              Riwayat
            </Tabs.Tab>
            <Tabs.Tab value="analytics" leftSection={<IconTrendingUp size={16} />}>
              Analisis
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="today" pt="md">
            <Stack gap="md">
              {/* Date Selection */}
              <Card withBorder radius="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>Tanggal Absensi</Text>
                    <Text size="sm" c="dimmed">Pilih tanggal untuk mencatat absensi</Text>
                  </div>
                  <TextInput
                    value={selectedDate ? dayjs(selectedDate).format('DD/MM/YYYY') : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                        const [day, month, year] = value.split('/');
                        setSelectedDate(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)));
                      }
                    }}
                    placeholder="DD/MM/YYYY (contoh: 15/03/2024)"
                    size="md"
                    style={{ minWidth: 200 }}
                  />
                </Group>
              </Card>

              {/* Controls */}
              <Card withBorder radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Kontrol Absensi</Text>
                    <Switch
                      label="Tampilkan yang belum absen"
                      checked={showOnlyAbsent}
                      onChange={(e) => setShowOnlyAbsent(e.currentTarget.checked)}
                      size="sm"
                    />
                  </Group>

                  <TextInput
                    placeholder="Cari siswa..."
                    leftSection={<IconSearch size={16} />}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ maxWidth: 400 }}
                  />

                  {Object.keys(attendanceStatuses).length > 0 && (
                    <Alert color="blue" icon={<IconBolt size={16} />}>
                      <Group justify="space-between">
                        <Text size="sm">
                          {Object.keys(attendanceStatuses).length} siswa sudah dipilih statusnya
                        </Text>
                        <Button 
                          size="xs" 
                          onClick={handleSubmitAttendance}
                          leftSection={<IconBolt size={14} />}
                        >
                          Catat Absensi
                        </Button>
                      </Group>
                    </Alert>
                  )}
                </Stack>
              </Card>

              {/* Student List */}
              <Card withBorder radius="md">
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={600}>Daftar Siswa ({filteredStudents.length})</Text>
                  </Group>

                  <ScrollArea h={400}>
                    <Stack gap="xs">
                      {filteredStudents.map((student) => {
                        const attendanceStatus = getAttendanceStatus(student.id);
                        const currentStatus = getAttendanceStatusFromForm(student.id) || '';
                        const currentNote = attendanceNotes[student.id] || '';
                        
                        // Use form status if available, otherwise use saved status
                        const displayStatus = currentStatus || attendanceStatus;
                        
                        return (
                          <Paper 
                            key={student.id} 
                            p="md" 
                            withBorder 
                            radius="md"
                          >
                            <Group justify="space-between">
                              <Group gap="md">
                                <Avatar size="md" radius="xl" color="blue">
                                  {student.full_name?.charAt(0) || 'S'}
                                </Avatar>
                                
                                <div>
                                  <Text fw={500}>{student.full_name || 'Unknown Student'}</Text>
                                  <Text size="sm" c="dimmed">{student.email}</Text>
                                </div>
                              </Group>

                              <Group gap="md">
                                <Radio.Group
                                  value={currentStatus}
                                  onChange={(value) => handleStatusChange(student.id, value as any)}
                                >
                                  <Group gap="md">
                                    <Radio
                                      value="present"
                                      label="Hadir"
                                      color="green"
                                      size="sm"
                                    />
                                    <Radio
                                      value="absent"
                                      label="Tidak Hadir"
                                      color="red"
                                      size="sm"
                                    />
                                    <Radio
                                      value="sick"
                                      label="Sakit"
                                      color="yellow"
                                      size="sm"
                                    />
                                    <Radio
                                      value="permission"
                                      label="Izin"
                                      color="blue"
                                      size="sm"
                                    />
                                  </Group>
                                </Radio.Group>

                                {displayStatus && (
                                  <Badge 
                                    color={getStatusColor(displayStatus)}
                                    variant="light" 
                                    size="lg"
                                    leftSection={getStatusIcon(displayStatus)}
                                  >
                                    {getStatusLabel(displayStatus)}
                                  </Badge>
                                )}
                              </Group>
                            </Group>

                            <Divider my="sm" />
                            <TextInput
                              placeholder="Keterangan (opsional)"
                              value={currentNote}
                              onChange={(e) => handleNoteChange(student.id, e.target.value)}
                              size="sm"
                            />
                          </Paper>
                        );
                      })}
                    </Stack>
                  </ScrollArea>
                </Stack>
              </Card>
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="md">
            <Card withBorder radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>Riwayat Absensi</Text>
                    <Text size="sm" c="dimmed">
                      Riwayat lengkap absensi 30 hari terakhir
                    </Text>
                  </div>
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconRefresh size={16} />}
                    onClick={loadFullAttendanceHistory}
                    loading={loadingHistory}
                  >
                    Refresh
                  </Button>
                </Group>

                {loadingHistory ? (
                  <LoadingSpinner message="Memuat riwayat absensi..." />
                ) : Object.keys(attendanceHistoryByDate).length === 0 ? (
                  <EmptyState
                    icon={IconHistory}
                    title="Belum ada riwayat"
                    description="Belum ada data absensi untuk periode ini"
                  />
                ) : (
                  <ScrollArea h={600}>
                    <Stack gap="xs">
                      {Object.keys(attendanceHistoryByDate)
                        .sort((a, b) => dayjs(b).valueOf() - dayjs(a).valueOf())
                        .map((date) => {
                          const attendances = attendanceHistoryByDate[date];
                          const total = attendances.length;
                          const present = attendances.filter((a: any) => a.status === 'present').length;
                          const absent = attendances.filter((a: any) => a.status === 'absent').length;
                          const sick = attendances.filter((a: any) => a.status === 'sick').length;
                          const permission = attendances.filter((a: any) => a.status === 'permission').length;
                          const isExpanded = expandedDate === date;

                          return (
                            <Paper key={date} p="md" withBorder radius="md">
                              <Group 
                                justify="space-between" 
                                style={{ cursor: 'pointer' }}
                                onClick={() => setExpandedDate(isExpanded ? null : date)}
                              >
                                <Group gap="md">
                                  <ThemeIcon size="lg" variant="light" color="blue">
                                    <IconCalendar size={20} />
                                  </ThemeIcon>
                                  <div>
                                    <Text fw={600}>
                                      {dayjs(date).format('DD MMMM YYYY')}
                                    </Text>
                                    <Text size="sm" c="dimmed">
                                      {dayjs(date).format('DD/MM/YYYY')}
                                    </Text>
                                  </div>
                                </Group>
                                <Group gap="lg">
                                  <Group gap="xs">
                                    <Badge color="green" variant="light">
                                      {present} Hadir
                                    </Badge>
                                    <Badge color="red" variant="light">
                                      {absent} Tidak Hadir
                                    </Badge>
                                    <Badge color="yellow" variant="light">
                                      {sick} Sakit
                                    </Badge>
                                    <Badge color="blue" variant="light">
                                      {permission} Izin
                                    </Badge>
                                  </Group>
                                  <Text fw={600} size="sm" c="dimmed">
                                    Total: {total} siswa
                                  </Text>
                                  <ActionIcon
                                    variant="subtle"
                                    color="blue"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setExpandedDate(isExpanded ? null : date);
                                    }}
                                  >
                                    <IconBolt 
                                      size={16} 
                                      style={{ 
                                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.2s'
                                      }} 
                                    />
                                  </ActionIcon>
                                </Group>
                              </Group>

                              {isExpanded && (
                                <>
                                  <Divider my="md" />
                                  <Stack gap="xs">
                                    <Text fw={600} size="sm" mb="xs">
                                      Daftar Siswa:
                                    </Text>
                                    {attendances.map((attendance: any) => (
                                      <Paper key={attendance.id} p="sm" withBorder radius="sm">
                                        <Group justify="space-between">
                                          <Group gap="md">
                                            <Avatar size="sm" radius="xl" color="blue">
                                              {attendance.student?.full_name?.charAt(0) || 'S'}
                                            </Avatar>
                                            <div>
                                              <Text fw={500} size="sm">
                                                {attendance.student?.full_name || 'Unknown Student'}
                                              </Text>
                                              <Text size="xs" c="dimmed">
                                                {attendance.student?.email || ''}
                                              </Text>
                                            </div>
                                          </Group>
                                          <Group gap="md">
                                            <Badge
                                              color={getStatusColor(attendance.status)}
                                              variant="light"
                                              size="md"
                                              leftSection={getStatusIcon(attendance.status)}
                                            >
                                              {getStatusLabel(attendance.status)}
                                            </Badge>
                                            {attendance.notes && (
                                              <Text size="xs" c="dimmed" style={{ maxWidth: 200 }} truncate="end">
                                                {attendance.notes}
                                              </Text>
                                            )}
                                            <Text size="xs" c="dimmed">
                                              {dayjs(attendance.created_at).format('HH:mm')}
                                            </Text>
                                          </Group>
                                        </Group>
                                      </Paper>
                                    ))}
                                  </Stack>
                                </>
                              )}
                            </Paper>
                          );
                        })}
                    </Stack>
                  </ScrollArea>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>

          <Tabs.Panel value="analytics" pt="md">
            <Card withBorder radius="md">
              <Stack gap="md">
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>Analisis Absensi</Text>
                    <Text size="sm" c="dimmed">
                      Statistik dan analisis absensi 30 hari terakhir
                    </Text>
                  </div>
                  <Button
                    variant="light"
                    size="sm"
                    leftSection={<IconRefresh size={16} />}
                    onClick={loadAttendanceAnalytics}
                    loading={loadingAnalytics}
                  >
                    Refresh
                  </Button>
                </Group>

                {loadingAnalytics ? (
                  <LoadingSpinner message="Memuat analisis..." />
                ) : !attendanceStats ? (
                  <EmptyState
                    icon={IconTrendingUp}
                    title="Belum ada data"
                    description="Belum ada data untuk dianalisis"
                  />
                ) : (
                  <Stack gap="xl">
                    {/* Overall Statistics */}
                    <SimpleGrid cols={{ base: 2, sm: 4 }}>
                      <Paper p="md" withBorder radius="md">
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Total Sesi</Text>
                          <Text size="xl" fw={700}>{attendanceStats.totalDays}</Text>
                        </Stack>
                      </Paper>
                      <Paper p="md" withBorder radius="md">
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Total Siswa</Text>
                          <Text size="xl" fw={700}>{attendanceStats.totalStudents}</Text>
                        </Stack>
                      </Paper>
                      <Paper p="md" withBorder radius="md">
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Rata-rata Kehadiran</Text>
                          <Text size="xl" fw={700} c="green">
                            {attendanceStats.classAverage.toFixed(1)}%
                          </Text>
                        </Stack>
                      </Paper>
                      <Paper p="md" withBorder radius="md">
                        <Stack gap="xs">
                          <Text size="sm" c="dimmed">Periode</Text>
                          <Text size="xs" fw={500}>30 hari terakhir</Text>
                        </Stack>
                      </Paper>
                    </SimpleGrid>

                    {/* Class Average Progress */}
                    <Card withBorder radius="md">
                      <Stack gap="md">
                        <Group justify="space-between">
                          <Text fw={600}>Rata-rata Kehadiran Kelas</Text>
                          <Text size="sm" fw={700} c="green">
                            {attendanceStats.classAverage.toFixed(1)}%
                          </Text>
                        </Group>
                        <Progress
                          value={attendanceStats.classAverage}
                          size="lg"
                          radius="md"
                          color="green"
                        />
                        <Text size="sm" c="dimmed" ta="center">
                          Dari {attendanceStats.totalDays} sesi, rata-rata kehadiran adalah{' '}
                          {attendanceStats.classAverage.toFixed(1)}%
                        </Text>
                      </Stack>
                    </Card>

                    {/* Student Statistics Table */}
                    <Card withBorder radius="md">
                      <Stack gap="md">
                        <Text fw={600}>Statistik per Siswa</Text>
                        <ScrollArea h={400}>
                          <Stack gap="xs">
                            {attendanceStats.studentStats && attendanceStats.studentStats.length > 0 ? (
                              attendanceStats.studentStats.map((stat: any, index: number) => {
                                const student = students.find(s => s.id === stat.student_id);
                                return (
                                  <Paper key={stat.student_id || index} p="md" withBorder radius="md">
                                    <Group justify="space-between">
                                      <div>
                                        <Text fw={500}>
                                          {student?.full_name || 'Unknown Student'}
                                        </Text>
                                        <Text size="sm" c="dimmed">
                                          {stat.presentDays} dari {stat.totalDays} hari hadir
                                        </Text>
                                      </div>
                                      <Group gap="md">
                                        <Progress
                                          value={stat.attendanceRate}
                                          size="sm"
                                          radius="md"
                                          color={stat.attendanceRate >= 80 ? 'green' : stat.attendanceRate >= 60 ? 'yellow' : 'red'}
                                          style={{ minWidth: 150 }}
                                        />
                                        <Text fw={600} size="sm">
                                          {stat.attendanceRate.toFixed(1)}%
                                        </Text>
                                      </Group>
                                    </Group>
                                  </Paper>
                                );
                              })
                            ) : (
                              <Text size="sm" c="dimmed" ta="center">
                                Belum ada data statistik siswa
                              </Text>
                            )}
                          </Stack>
                        </ScrollArea>
                      </Stack>
                    </Card>
                  </Stack>
                )}
              </Stack>
            </Card>
          </Tabs.Panel>
        </Tabs>
      </Stack>
    </Container>
  );
}