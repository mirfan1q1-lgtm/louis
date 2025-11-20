import { useState, useEffect } from 'react';
import { 
  Container, 
  Title, 
  Text, 
  Stack, 
  Group, 
  Button, 
  TextInput, 
              Select, 
              SimpleGrid,
              Paper,
              Badge,
              Modal,
              Textarea,
              PasswordInput,
              Alert
} from '@mantine/core';
import { 
  IconPlus, 
  IconSearch, 
  IconUsers,
  IconUserX,
  IconFileUpload,
  IconFileDownload,
  IconArrowRight,
  IconTrash,
  IconUserCheck
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { Student } from '../../types';
import { studentService } from '../../services/studentService';
import { classService } from '../../services/classService';
import { StudentsTable, LoadingSpinner, EmptyState, ConfirmDialog, ExcelImport, usePagination } from '../../components';
import { notifications } from '@mantine/notifications';
import { GRADE_OPTIONS } from '../../utils/romanNumerals';
import dayjs from 'dayjs';

export function StudentList() {
  const { user } = useAuth();
  const teacher = user!;
  
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<(Student & { class_count?: number; created_by_teacher?: { full_name: string }; classes?: any[] })[]>([]);
  const [filteredStudents, setFilteredStudents] = useState(students);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [classFilter, setClassFilter] = useState<string | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string | null>(null);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [moveClassModalOpen, setMoveClassModalOpen] = useState(false);
  const [bulkMoveClassModalOpen, setBulkMoveClassModalOpen] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkToggleStatusModalOpen, setBulkToggleStatusModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentClasses, setStudentClasses] = useState<any[]>([]);
  const [allClasses, setAllClasses] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [moveClassLoading, setMoveClassLoading] = useState(false);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);

  // Pagination
  const {
    currentPage,
    itemsPerPage,
    totalItems,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange,
    resetPagination
  } = usePagination(filteredStudents, 10, 1);

  const form = useForm({
    initialValues: {
      full_name: '',
      email: '',
      birth_date: '',
      phone: '',
      address: '',
      password: '',
    },
    validate: {
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
      email: (value) => (!value ? 'Email harus diisi' : (!/^\S+@\S+$/.test(value) ? 'Email tidak valid' : null)),
      birth_date: (value) => (!value ? 'Tanggal lahir harus diisi' : null),
      password: (value, values) => {
        // Only validate password when creating new student (no selectedStudent)
        if (!selectedStudent && !value) {
          return 'Password harus diisi';
        }
        return null;
      },
    },
  });

  const passwordForm = useForm({
    initialValues: {
      new_password: '',
      confirm_password: '',
    },
    validate: {
      new_password: (value) => (!value ? 'Password baru harus diisi' : (value.length < 6 ? 'Password minimal 6 karakter' : null)),
      confirm_password: (value, values) => (value !== values?.new_password ? 'Password tidak sesuai' : null),
    },
  });

  const moveClassForm = useForm({
    initialValues: {
      from_class_id: '',
      to_class_id: '',
    },
    validate: {
      from_class_id: (value) => (!value ? 'Kelas asal harus dipilih' : null),
      to_class_id: (value) => (!value ? 'Kelas tujuan harus dipilih' : null),
    },
  });

  const bulkMoveClassForm = useForm({
    initialValues: {
      to_class_id: '',
    },
    validate: {
      to_class_id: (value) => (!value ? 'Kelas tujuan harus dipilih' : null),
    },
  });

  useEffect(() => {
    loadStudents();
    loadAllClasses();
  }, []);

  const loadAllClasses = async () => {
    try {
      const data = await classService.getAllClasses();
      setAllClasses(data);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, classFilter, gradeFilter, selectedClassFilter]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const data = await studentService.getAllStudents();
      
      // Load class information for each student
      const studentsWithClasses = await Promise.all(
        (data || []).map(async (student) => {
          try {
            const classes = await studentService.getStudentClasses(student.id);
            return {
              ...student,
              classes: classes.map((cs: any) => cs.class)
            };
          } catch (error) {
            return { ...student, classes: [] };
          }
        })
      );
      
      setStudents(studentsWithClasses);
    } catch (error) {
      console.error('Error loading students:', error);
      notifications.show({
        title: 'Error',
        message: 'Gagal memuat data siswa',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student => 
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter) {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(student => student.is_active === isActive);
    }

    if (classFilter === 'no_class') {
      filtered = filtered.filter(student => !student.class_count || student.class_count === 0);
    } else if (classFilter === 'has_class') {
      filtered = filtered.filter(student => student.class_count && student.class_count > 0);
    }

    // Filter by grade
    if (gradeFilter) {
      filtered = filtered.filter(student => {
        if (!student.classes || student.classes.length === 0) return false;
        return student.classes.some((cls: any) => cls.grade === gradeFilter);
      });
    }

    // Filter by specific class
    if (selectedClassFilter) {
      filtered = filtered.filter(student => {
        if (!student.classes || student.classes.length === 0) return false;
        return student.classes.some((cls: any) => cls.id === selectedClassFilter);
      });
    }

    setFilteredStudents(filtered);
    resetPagination();
  };

  const handleCreateStudent = async (values: typeof form.values) => {
    try {
      setSubmitting(true);
      await studentService.createStudent(
        {
          email: values.email,
          full_name: values.full_name,
          birth_date: values.birth_date,
          address: values.address,
          phone: values.phone,
        },
        values.password,
        teacher.id
      );
      
      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil dibuat',
        color: 'green',
      });
      
      form.reset();
      setCreateModalOpen(false);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal membuat siswa',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStudent = async (values: typeof form.values) => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      await studentService.updateStudent(selectedStudent.id, {
        full_name: values.full_name,
        email: values.email,
        birth_date: values.birth_date,
        phone: values.phone,
        address: values.address,
      }, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Data siswa berhasil diperbarui',
        color: 'green',
      });
      
      form.reset();
      setEditModalOpen(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memperbarui data siswa',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async () => {
    if (!selectedStudent) return;

    try {
      setSubmitting(true);
      await studentService.deleteStudent(selectedStudent.id, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil dihapus',
        color: 'green',
      });
      
      setDeleteModalOpen(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menghapus siswa',
        color: 'red',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePassword = async (values: typeof passwordForm.values) => {
    if (!selectedStudent) return;

    try {
      setPasswordLoading(true);
      await studentService.updatePassword(selectedStudent.id, values.new_password, teacher.id);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Password berhasil diperbarui',
        color: 'green',
      });
      
      passwordForm.reset();
      setPasswordModalOpen(false);
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memperbarui password',
        color: 'red',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleToggleStatus = async (studentId: string, isActive: boolean) => {
    try {
      if (isActive) {
        await studentService.activateStudent(studentId, teacher.id);
      } else {
        await studentService.deactivateStudent(studentId, teacher.id);
      }
      
      notifications.show({
        title: 'Berhasil',
        message: `Siswa berhasil ${isActive ? 'diaktifkan' : 'dinonaktifkan'}`,
        color: 'green',
      });
      
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mengubah status siswa',
        color: 'red',
      });
    }
  };

  const openEditModal = (student: Student) => {
    setSelectedStudent(student);
    form.setValues({
      full_name: student.full_name,
      email: student.email,
      birth_date: dayjs(student.birth_date).format('YYYY-MM-DD'),
      phone: student.phone || '',
      address: student.address || '',
      password: '',
    });
    setEditModalOpen(true);
  };

  const openDeleteModal = (student: Student) => {
    setSelectedStudent(student);
    setDeleteModalOpen(true);
  };

  const openPasswordModal = (student: Student) => {
    setSelectedStudent(student);
    passwordForm.reset();
    setPasswordModalOpen(true);
  };

  const openMoveClassModal = async (student: Student) => {
    setSelectedStudent(student);
    setMoveClassModalOpen(true);
    
    try {
      // Get student's current classes
      const classes = await studentService.getStudentClasses(student.id);
      setStudentClasses(classes);
      
      // Set default from_class_id to first class if exists
      if (classes.length > 0 && classes[0]?.class && typeof classes[0].class === 'object' && 'id' in classes[0].class) {
        moveClassForm.setFieldValue('from_class_id', (classes[0].class as any).id);
      }
      
      moveClassForm.reset();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memuat data kelas siswa',
        color: 'red',
      });
    }
  };

  const handleMoveClass = async (values: typeof moveClassForm.values) => {
    if (!selectedStudent) return;

    if (values.from_class_id === values.to_class_id) {
      notifications.show({
        title: 'Error',
        message: 'Kelas asal dan kelas tujuan harus berbeda',
        color: 'red',
      });
      return;
    }

    try {
      setMoveClassLoading(true);
      await classService.moveStudent(
        selectedStudent.id,
        values.from_class_id,
        values.to_class_id,
        teacher.id
      );
      
      notifications.show({
        title: 'Berhasil',
        message: 'Siswa berhasil dipindahkan ke kelas baru',
        color: 'green',
      });
      
      moveClassForm.reset();
      setMoveClassModalOpen(false);
      setSelectedStudent(null);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memindahkan siswa',
        color: 'red',
      });
    } finally {
      setMoveClassLoading(false);
    }
  };

  const handleBulkMoveClass = async (values: typeof bulkMoveClassForm.values) => {
    if (selectedStudents.length === 0) return;

    try {
      setBulkOperationLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const studentId of selectedStudents) {
        try {
          const student = students.find(s => s.id === studentId);
          if (!student || !student.classes || student.classes.length === 0) {
            errorCount++;
            continue;
          }

          // Get first class as from_class
          const fromClassId = student.classes[0].id;
          
          if (fromClassId === values.to_class_id) {
            errorCount++;
            continue;
          }

          await classService.moveStudent(
            studentId,
            fromClassId,
            values.to_class_id,
            teacher.id
          );
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      notifications.show({
        title: 'Berhasil',
        message: `${successCount} siswa berhasil dipindahkan${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
        color: successCount > 0 ? 'green' : 'red',
      });

      bulkMoveClassForm.reset();
      setBulkMoveClassModalOpen(false);
      setSelectedStudents([]);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memindahkan siswa',
        color: 'red',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setBulkOperationLoading(true);
      let successCount = 0;
      let errorCount = 0;

      for (const studentId of selectedStudents) {
        try {
          await studentService.deleteStudent(studentId, teacher.id);
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      notifications.show({
        title: 'Berhasil',
        message: `${successCount} siswa berhasil dihapus${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
        color: successCount > 0 ? 'green' : 'red',
      });

      setBulkDeleteModalOpen(false);
      setSelectedStudents([]);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal menghapus siswa',
        color: 'red',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkToggleStatus = async () => {
    if (selectedStudents.length === 0) return;

    try {
      setBulkOperationLoading(true);
      let successCount = 0;
      let errorCount = 0;

      // Determine target status based on first selected student
      const firstStudent = students.find(s => s.id === selectedStudents[0]);
      const targetStatus = !firstStudent?.is_active;

      for (const studentId of selectedStudents) {
        try {
          if (targetStatus) {
            await studentService.activateStudent(studentId, teacher.id);
          } else {
            await studentService.deactivateStudent(studentId, teacher.id);
          }
          successCount++;
        } catch (error) {
          errorCount++;
        }
      }

      notifications.show({
        title: 'Berhasil',
        message: `${successCount} siswa berhasil ${targetStatus ? 'diaktifkan' : 'dinonaktifkan'}${errorCount > 0 ? `, ${errorCount} gagal` : ''}`,
        color: successCount > 0 ? 'green' : 'red',
      });

      setBulkToggleStatusModalOpen(false);
      setSelectedStudents([]);
      loadStudents();
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal mengubah status siswa',
        color: 'red',
      });
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Create workbook
      const XLSX = await import('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(
        filteredStudents.map(student => ({
          'Nama': student.full_name,
          'Email': student.email,
          'Tanggal Lahir': dayjs(student.birth_date).format('DD/MM/YYYY'),
          'No. HP': student.phone || '-',
          'Alamat': student.address || '-',
          'Jumlah Kelas': student.class_count || 0,
          'Status': student.is_active ? 'Aktif' : 'Tidak Aktif',
        }))
      );
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Siswa');
      XLSX.writeFile(workbook, `siswa_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      
      notifications.show({
        title: 'Berhasil',
        message: 'Data siswa berhasil diekspor',
        color: 'green',
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Gagal mengekspor data',
        color: 'red',
      });
    }
  };

  if (loading) {
    return <LoadingSpinner message="Memuat data siswa..." />;
  }

  const studentsWithoutClass = students.filter(s => !s.class_count || s.class_count === 0);
  const studentsWithClass = students.filter(s => s.class_count && s.class_count > 0);
  const activeStudents = students.filter(s => s.is_active);
  const inactiveStudents = students.filter(s => !s.is_active);

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Title order={1}>Manajemen Siswa</Title>
            <Text c="dimmed">Kelola data siswa Anda</Text>
          </div>
          <Group gap="sm">
            <Button
              variant="light"
              leftSection={<IconFileDownload size={16} />}
              onClick={handleExportExcel}
            >
              Ekspor Excel
            </Button>
            <Button
              variant="light"
              leftSection={<IconFileUpload size={16} />}
              onClick={() => setImportModalOpen(true)}
            >
              Impor Excel
            </Button>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => {
                form.reset();
                setCreateModalOpen(true);
              }}
            >
              Tambah Siswa
            </Button>
          </Group>
        </Group>

        {/* Stats */}
        <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-blue-6)" />
              <div>
                <Text size="lg" fw={600}>{students.length}</Text>
                <Text size="sm" c="dimmed">Total Siswa</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <Badge size="lg" color="green" variant="light">
                {activeStudents.length} Aktif
              </Badge>
              <Badge size="lg" color="red" variant="light">
                {inactiveStudents.length} Tidak Aktif
              </Badge>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUsers size={32} color="var(--mantine-color-green-6)" />
              <div>
                <Text size="lg" fw={600}>{studentsWithClass.length}</Text>
                <Text size="sm" c="dimmed">Dengan Kelas</Text>
              </div>
            </Group>
          </Paper>
          <Paper p="md" withBorder>
            <Group gap="md">
              <IconUserX size={32} color="var(--mantine-color-orange-6)" />
              <div>
                <Text size="lg" fw={600}>{studentsWithoutClass.length}</Text>
                <Text size="sm" c="dimmed">Tanpa Kelas</Text>
              </div>
            </Group>
          </Paper>
        </SimpleGrid>

        {/* Filters */}
        <Paper p="md" withBorder>
          <Group gap="md">
            <TextInput
              placeholder="Cari siswa (nama atau email)..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter Status"
              data={[
                { value: 'active', label: 'Aktif' },
                { value: 'inactive', label: 'Tidak Aktif' },
              ]}
              value={statusFilter}
              onChange={setStatusFilter}
              clearable
            />
            <Select
              placeholder="Filter Kelas"
              data={[
                { value: 'has_class', label: 'Dengan Kelas' },
                { value: 'no_class', label: 'Tanpa Kelas' },
              ]}
              value={classFilter}
              onChange={setClassFilter}
              clearable
            />
            <Select
              placeholder="Filter Tingkat"
              data={GRADE_OPTIONS}
              value={gradeFilter}
              onChange={setGradeFilter}
              clearable
            />
            <Select
              placeholder="Filter Kelas Spesifik"
              data={allClasses
                .filter(cls => cls.is_active)
                .map(cls => ({
                  value: cls.id,
                  label: `${cls.name} (Kelas ${cls.grade})`
                }))}
              value={selectedClassFilter}
              onChange={setSelectedClassFilter}
              clearable
              searchable
            />
          </Group>
        </Paper>

        {/* Bulk Actions */}
        {selectedStudents.length > 0 && (
          <Paper p="md" withBorder style={{ backgroundColor: 'var(--mantine-color-blue-0)' }}>
            <Group justify="space-between">
              <Text size="sm" fw={500}>
                {selectedStudents.length} siswa dipilih
              </Text>
              <Group gap="sm">
                <Button
                  size="xs"
                  variant="light"
                  color="blue"
                  leftSection={<IconArrowRight size={14} />}
                  onClick={() => setBulkMoveClassModalOpen(true)}
                >
                  Pindah Kelas
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="orange"
                  leftSection={<IconUserCheck size={14} />}
                  onClick={() => setBulkToggleStatusModalOpen(true)}
                >
                  Ubah Status
                </Button>
                <Button
                  size="xs"
                  variant="light"
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => setBulkDeleteModalOpen(true)}
                >
                  Hapus
                </Button>
                <Button
                  size="xs"
                  variant="subtle"
                  onClick={() => setSelectedStudents([])}
                >
                  Batal Pilih
                </Button>
              </Group>
            </Group>
          </Paper>
        )}

        {/* Students Table */}
        {paginatedData.length > 0 ? (
          <StudentsTable
            students={paginatedData}
            onEdit={openEditModal}
            onDelete={(studentId: string) => {
              const student = students.find(s => s.id === studentId);
              if (student) {
                openDeleteModal(student);
              }
            }}
            onToggleStatus={handleToggleStatus}
            onMoveClass={openMoveClassModal}
            onSelect={setSelectedStudents}
            selectedStudents={selectedStudents}
            showSelection={true}
            showPagination={true}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        ) : (
          <EmptyState
            icon={IconUsers}
            title="Tidak ada siswa"
            description={searchTerm || statusFilter || classFilter ? 
              "Tidak ada siswa yang sesuai dengan filter" : 
              "Belum ada siswa yang dibuat"
            }
            actionLabel="Tambah Siswa Pertama"
            onAction={() => {
              form.reset();
              setCreateModalOpen(true);
            }}
          />
        )}

        {/* Create Student Modal */}
        <Modal
          opened={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Tambah Siswa Baru"
          size="md"
        >
          <form onSubmit={form.onSubmit(handleCreateStudent)}>
            <Stack gap="md">
              <TextInput
                label="Nama Lengkap"
                placeholder="Nama lengkap siswa"
                required
                {...form.getInputProps('full_name')}
              />
              <TextInput
                label="Email"
                placeholder="email@example.com"
                required
                {...form.getInputProps('email')}
              />
              <TextInput
                label="Tanggal Lahir"
                type="date"
                required
                {...form.getInputProps('birth_date')}
              />
              <TextInput
                label="No. HP"
                placeholder="081234567890"
                {...form.getInputProps('phone')}
              />
              <Textarea
                label="Alamat"
                placeholder="Alamat siswa"
                rows={3}
                {...form.getInputProps('address')}
              />
              <PasswordInput
                label="Password"
                placeholder="Minimal 6 karakter"
                required
                {...form.getInputProps('password')}
              />
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Tambah Siswa
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Edit Student Modal */}
        <Modal
          opened={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedStudent(null);
          }}
          title="Edit Data Siswa"
          size="md"
        >
          <form onSubmit={form.onSubmit(handleEditStudent)}>
            <Stack gap="md">
              <TextInput
                label="Nama Lengkap"
                placeholder="Nama lengkap siswa"
                required
                {...form.getInputProps('full_name')}
              />
              <TextInput
                label="Email"
                placeholder="email@example.com"
                required
                {...form.getInputProps('email')}
              />
              <TextInput
                label="Tanggal Lahir"
                type="date"
                required
                {...form.getInputProps('birth_date')}
              />
              <TextInput
                label="No. HP"
                placeholder="081234567890"
                {...form.getInputProps('phone')}
              />
              <Textarea
                label="Alamat"
                placeholder="Alamat siswa"
                rows={3}
                {...form.getInputProps('address')}
              />
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setEditModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  disabled={submitting}
                >
                  Batal
                </Button>
                <Button type="submit" loading={submitting}>
                  Simpan Perubahan
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Password Modal */}
        <Modal
          opened={passwordModalOpen}
          onClose={() => {
            setPasswordModalOpen(false);
            setSelectedStudent(null);
          }}
          title="Ubah Password"
          size="md"
        >
          <form onSubmit={passwordForm.onSubmit(handleUpdatePassword)}>
            <Stack gap="md">
              <PasswordInput
                label="Password Baru"
                placeholder="Minimal 6 karakter"
                required
                {...passwordForm.getInputProps('new_password')}
              />
              <PasswordInput
                label="Konfirmasi Password"
                placeholder="Ulangi password baru"
                required
                {...passwordForm.getInputProps('confirm_password')}
              />
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setPasswordModalOpen(false);
                    setSelectedStudent(null);
                  }}
                  disabled={passwordLoading}
                >
                  Batal
                </Button>
                <Button type="submit" loading={passwordLoading}>
                  Ubah Password
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          opened={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedStudent(null);
          }}
          onConfirm={handleDeleteStudent}
          title="Hapus Siswa"
          message={`Apakah Anda yakin ingin menghapus siswa "${selectedStudent?.full_name}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait siswa ini.`}
          confirmLabel="Hapus"
          loading={submitting}
        />

        {/* Excel Import Modal */}
        <ExcelImport
          opened={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={async (data) => {
            try {
              setSubmitting(true);
              const results = await studentService.bulkImportStudents(
                data.map((row: any) => ({
                  email: row.email || row.Email || row.EMAIL,
                  full_name: row.full_name || row.name || row.Name || row.NAME || row['Nama'],
                  birth_date: row.birth_date || row['Tanggal Lahir'] || row['birth_date'],
                  phone: row.phone || row['No. HP'] || row['No HP'],
                })),
                teacher.id
              );
              
              notifications.show({
                title: 'Berhasil',
                message: `Berhasil mengimpor ${results.results.length} siswa`,
                color: 'green',
              });
              
              setImportModalOpen(false);
              loadStudents();
              
              return {
                success: results.results.length,
                errors: results.errors
              };
            } catch (error: any) {
              notifications.show({
                title: 'Error',
                message: error.message || 'Gagal mengimpor data',
                color: 'red',
              });
              
              return {
                success: 0,
                errors: [{ error: error.message || 'Gagal mengimpor data' }]
              };
            } finally {
              setSubmitting(false);
            }
          }}
        />

        {/* Move Class Modal */}
        <Modal
          opened={moveClassModalOpen}
          onClose={() => {
            setMoveClassModalOpen(false);
            setSelectedStudent(null);
            setStudentClasses([]);
            moveClassForm.reset();
          }}
          title="Pindah Kelas"
          size="md"
        >
          <form onSubmit={moveClassForm.onSubmit(handleMoveClass)}>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Pindahkan {selectedStudent?.full_name} dari kelas asal ke kelas tujuan
              </Text>
              
              <Select
                label="Kelas Asal"
                placeholder="Pilih kelas asal"
                data={studentClasses.map((cs: any) => ({
                  value: cs.class.id,
                  label: `${cs.class.name} (Kelas ${cs.class.grade})`,
                }))}
                required
                {...moveClassForm.getInputProps('from_class_id')}
              />
              
              <Select
                label="Kelas Tujuan"
                placeholder="Pilih kelas tujuan"
                data={allClasses
                  .filter(cls => cls.is_active)
                  .filter(cls => {
                    // Filter out the source class and classes student is already enrolled in
                    const isSourceClass = cls.id === moveClassForm.values.from_class_id;
                    const isAlreadyEnrolled = studentClasses.some((cs: any) => cs.class.id === cls.id);
                    return !isSourceClass && !isAlreadyEnrolled;
                  })
                  .map(cls => ({
                    value: cls.id,
                    label: `${cls.name} (Kelas ${cls.grade})`,
                  }))}
                required
                {...moveClassForm.getInputProps('to_class_id')}
              />
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setMoveClassModalOpen(false);
                    setSelectedStudent(null);
                    setStudentClasses([]);
                    moveClassForm.reset();
                  }}
                  disabled={moveClassLoading}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  loading={moveClassLoading}
                  leftSection={<IconArrowRight size={16} />}
                >
                  Pindah Kelas
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Bulk Move Class Modal */}
        <Modal
          opened={bulkMoveClassModalOpen}
          onClose={() => {
            setBulkMoveClassModalOpen(false);
            bulkMoveClassForm.reset();
          }}
          title="Pindah Kelas (Bulk)"
          size="md"
        >
          <form onSubmit={bulkMoveClassForm.onSubmit(handleBulkMoveClass)}>
            <Stack gap="md">
              <Text size="sm" c="dimmed">
                Pindahkan {selectedStudents.length} siswa ke kelas tujuan
              </Text>
              
              <Select
                label="Kelas Tujuan"
                placeholder="Pilih kelas tujuan"
                data={allClasses
                  .filter(cls => cls.is_active)
                  .map(cls => ({
                    value: cls.id,
                    label: `${cls.name} (Kelas ${cls.grade})`,
                  }))}
                required
                searchable
                {...bulkMoveClassForm.getInputProps('to_class_id')}
              />
              
              <Alert color="blue" title="Catatan">
                Siswa akan dipindahkan dari kelas pertama mereka ke kelas tujuan yang dipilih.
              </Alert>
              
              <Group justify="flex-end" gap="sm">
                <Button
                  variant="subtle"
                  onClick={() => {
                    setBulkMoveClassModalOpen(false);
                    bulkMoveClassForm.reset();
                  }}
                  disabled={bulkOperationLoading}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  loading={bulkOperationLoading}
                  leftSection={<IconArrowRight size={16} />}
                >
                  Pindah {selectedStudents.length} Siswa
                </Button>
              </Group>
            </Stack>
          </form>
        </Modal>

        {/* Bulk Delete Confirmation Modal */}
        <ConfirmDialog
          opened={bulkDeleteModalOpen}
          onClose={() => setBulkDeleteModalOpen(false)}
          onConfirm={handleBulkDelete}
          title="Hapus Siswa (Bulk)"
          message={`Apakah Anda yakin ingin menghapus ${selectedStudents.length} siswa yang dipilih? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua data terkait siswa-siswa ini.`}
          confirmLabel="Hapus"
          loading={bulkOperationLoading}
        />

        {/* Bulk Toggle Status Confirmation Modal */}
        <ConfirmDialog
          opened={bulkToggleStatusModalOpen}
          onClose={() => setBulkToggleStatusModalOpen(false)}
          onConfirm={handleBulkToggleStatus}
          title="Ubah Status Siswa (Bulk)"
          message={`Apakah Anda yakin ingin mengubah status ${selectedStudents.length} siswa yang dipilih?`}
          confirmLabel="Ubah Status"
          loading={bulkOperationLoading}
        />
      </Stack>
    </Container>
  );
}

