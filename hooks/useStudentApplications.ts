import { useQuery } from '@tanstack/react-query';

import {
  fetchApplicationsForStudent,
  type StudentApplicationRow,
} from '@/lib/data/applications';
import { queryKeys } from '@/lib/queryKeys';
import { supabase } from '@/lib/supabase';

export type { StudentApplicationRow };

export function useStudentApplications() {
  return useQuery({
    queryKey: queryKeys.studentApplications,
    queryFn: async (): Promise<StudentApplicationRow[]> => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];
      return fetchApplicationsForStudent(session.user.id);
    },
    staleTime: 20_000,
  });
}
