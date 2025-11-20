import { supabase } from '../lib/supabase';
import { Teacher } from '../types';

export const authService = {
  async loginTeacher(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Teacher profile should be auto-created by trigger when user is created in auth.users
    // But we'll use RPC function as fallback to ensure it exists
    const { data: teacherData, error: rpcError } = await supabase
      .rpc('create_or_get_teacher_profile', {
        teacher_id: data.user.id,
        teacher_email: data.user.email || email,
        teacher_full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Teacher',
      });

    if (rpcError) {
      // Fallback: try direct query if RPC fails
      console.warn('RPC function failed, trying direct query:', rpcError);
      
      // Wait a bit for trigger to complete (if it exists)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if teacher profile exists
      let { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', data.user.id)
        .maybeSingle();

      if (teacherError) {
        console.error('Error fetching teacher:', teacherError);
        throw teacherError;
      }

      // If teacher profile doesn't exist, try to create it
      if (!teacher) {
        const { data: newTeacher, error: createError } = await supabase
          .from('teachers')
          .insert({
            id: data.user.id,
            email: data.user.email || email,
            full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Teacher',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating teacher profile:', createError);
          throw new Error(`Failed to create teacher profile: ${createError.message}`);
        }
        teacher = newTeacher;
      }

      return { user: data.user, teacher };
    }

    // RPC function succeeded
    if (!teacherData || teacherData.length === 0) {
      throw new Error('Failed to create or retrieve teacher profile');
    }

    const teacher = teacherData[0] as Teacher;
    return { user: data.user, teacher };
  },

  async getCurrentTeacher(): Promise<Teacher | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    // Teacher profile should exist (created by trigger), but use RPC as fallback
    const { data: teacherData, error: rpcError } = await supabase
      .rpc('create_or_get_teacher_profile', {
        teacher_id: user.id,
        teacher_email: user.email || '',
        teacher_full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher',
      });

    if (rpcError) {
      // Fallback: try direct query
      console.warn('RPC function failed, trying direct query:', rpcError);
      
      let { data: teacher, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching teacher:', error);
        throw error;
      }

      if (!teacher) {
        const { data: newTeacher, error: createError } = await supabase
          .from('teachers')
          .insert({
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Teacher',
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating teacher profile:', createError);
          throw createError;
        }
        teacher = newTeacher;
      }

      return teacher;
    }

    if (!teacherData || teacherData.length === 0) {
      return null;
    }

    return teacherData[0] as Teacher;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        callback(session?.user || null);
      })();
    });
  },
};
