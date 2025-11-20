import { useState, useEffect } from 'react';
import {
  Container,
  Title,
  Text,
  Stack,
  Group,
  Button,
  Card,
  TextInput,
  Alert,
  Avatar,
} from '@mantine/core';
import { 
  IconUser,
  IconMail,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/authService';
import { supabase } from '../../lib/supabase';
import { LoadingSpinner } from '../../components';
import { notifications } from '@mantine/notifications';
import dayjs from 'dayjs';

export function TeacherProfile() {
  const { user } = useAuth();
  
  if (!user) {
    return <LoadingSpinner message="Memuat profil..." />;
  }
  
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      full_name: user.full_name,
    },
    validate: {
      full_name: (value) => (!value ? 'Nama lengkap harus diisi' : null),
    },
  });

  const handleUpdateProfile = async (values: typeof form.values) => {
    setLoading(true);
    try {
      // Update nama di tabel teachers
      const { error: updateError } = await supabase
        .from('teachers')
        .update({ full_name: values.full_name })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Refresh user data
      const updatedTeacher = await authService.getCurrentTeacher();
      if (updatedTeacher) {
        // Update context akan dilakukan secara otomatis melalui auth state change
        window.location.reload(); // Simple reload to refresh data
      }

      notifications.show({
        title: 'Berhasil',
        message: 'Nama berhasil diperbarui',
        color: 'green',
      });
    } catch (error: any) {
      notifications.show({
        title: 'Error',
        message: error.message || 'Gagal memperbarui nama',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container size="md" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <div>
          <Title order={1}>Profil Guru</Title>
          <Text c="dimmed">Kelola informasi profil Anda</Text>
        </div>

        {/* Profile Information */}
        <Card withBorder>
          <Stack gap="md">
            <Group gap="md">
              <Avatar size="lg" radius="xl" color="blue">
                {user.full_name?.charAt(0) || 'T'}
              </Avatar>
              <div>
                <Text fw={600} size="lg">{user.full_name || 'Unknown Teacher'}</Text>
                <Text c="dimmed">{user.email}</Text>
                <Text size="sm" c="dimmed">
                  Bergabung: {dayjs(user.created_at).format('DD/MM/YYYY')}
                </Text>
              </div>
            </Group>
          </Stack>
        </Card>

        {/* Edit Profile Form */}
        <Card withBorder>
          <Stack gap="md">
            <Text fw={600}>Informasi Profil</Text>
            
            <Alert color="blue" icon={<IconInfoCircle size={16} />}>
              <Text size="sm">
                Anda hanya dapat mengubah nama. Untuk mengubah email dan password, silakan hubungi administrator atau ubah langsung di Supabase.
              </Text>
            </Alert>
            
            <form onSubmit={form.onSubmit(handleUpdateProfile)}>
              <Stack gap="md">
                <TextInput
                  label="Nama Lengkap"
                  placeholder="Masukkan nama lengkap"
                  required
                  leftSection={<IconUser size={16} />}
                  {...form.getInputProps('full_name')}
                />

                <TextInput
                  label="Email"
                  value={user.email}
                  disabled
                  leftSection={<IconMail size={16} />}
                  description="Email tidak dapat diubah dari halaman ini"
                />

                <Group justify="flex-end">
                  <Button type="submit" loading={loading}>
                    Simpan Perubahan
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        </Card>

        {/* Info Card for Email/Password */}
        <Card withBorder bg="gray.0">
          <Stack gap="md">
            <Group gap="xs">
              <IconAlertCircle size={20} color="var(--mantine-color-orange-6)" />
              <Text fw={600}>Mengubah Email atau Password</Text>
            </Group>
            <Text size="sm" c="dimmed">
              Untuk mengubah email atau password, silakan:
              <br />
              1. Buka Supabase Dashboard
              <br />
              2. Masuk ke Authentication → Users
              <br />
              3. Cari user dengan email: <strong>{user.email}</strong>
              <br />
              4. Edit email atau reset password sesuai kebutuhan
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Container>
  );
}

