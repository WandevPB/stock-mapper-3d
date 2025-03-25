
import { supabase, userManagement, UserRole, UserApproval } from '@/integrations/supabase/client';

interface UserData {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_approved: boolean;
  is_admin: boolean;
}

export const UserManagementService = {
  fetchUsers: async (): Promise<UserData[]> => {
    try {
      // Get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Get approved users 
      const { data: approvedUsers, error: approvedError } = await userManagement.listUserApprovals();
        
      if (approvedError) throw approvedError;
      
      // Get admin users
      const { data: adminUsers, error: adminError } = await userManagement.listUsersWithRole('admin');
        
      if (adminError) throw adminError;
      
      // Map to a more usable format
      const approvedMap = new Map(approvedUsers?.map(u => [u.user_id, u.is_approved]) || []);
      const adminMap = new Set(adminUsers?.map(u => u.user_id) || []);
      
      const formattedUsers = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        created_at: user.created_at,
        is_approved: approvedMap.get(user.id) || false,
        is_admin: adminMap.has(user.id)
      }));
      
      return formattedUsers;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  approveUser: async (userId: string): Promise<void> => {
    const { error } = await userManagement.setUserApproval(userId, true);
    if (error) throw error;
  },

  removeApproval: async (userId: string): Promise<void> => {
    const { error } = await userManagement.setUserApproval(userId, false);
    if (error) throw error;
  },

  toggleAdmin: async (userId: string, isCurrentlyAdmin: boolean): Promise<void> => {
    if (isCurrentlyAdmin) {
      // Remove admin role
      const { error } = await userManagement.removeUserRole(userId, 'admin');
      if (error) throw error;
    } else {
      // Add admin role
      const { error } = await userManagement.addUserRole(userId, 'admin');
      if (error) throw error;
    }
  }
};
