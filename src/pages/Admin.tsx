
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import UserTable from '@/components/admin/UserTable';
import { useToast } from '@/hooks/use-toast';
import { UserManagementService } from '@/services/UserManagementService';

interface UserData {
  id: string;
  email: string;
  name: string;
  created_at: string;
  is_approved: boolean;
  is_admin: boolean;
}

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    
    if (!isAdmin) {
      navigate('/');
      toast({
        variant: "destructive",
        title: "Acesso Restrito",
        description: "Você não tem permissão para acessar esta página.",
      });
      return;
    }

    fetchUsers();
  }, [user, isAdmin, navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const userData = await UserManagementService.fetchUsers();
      setUsers(userData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível carregar os usuários.",
      });
    } finally {
      setLoading(false);
    }
  };

  const approveUser = async (userId: string) => {
    try {
      await UserManagementService.approveUser(userId);
      toast({
        title: "Sucesso",
        description: "Usuário aprovado com sucesso.",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aprovar o usuário.",
      });
    }
  };

  const removeApproval = async (userId: string) => {
    try {
      await UserManagementService.removeApproval(userId);
      toast({
        title: "Sucesso",
        description: "Aprovação do usuário removida com sucesso.",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error removing approval:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível remover a aprovação do usuário.",
      });
    }
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    try {
      await UserManagementService.toggleAdmin(userId, isCurrentlyAdmin);
      toast({
        title: "Sucesso",
        description: isCurrentlyAdmin 
          ? "Privilégios de administrador removidos." 
          : "Privilégios de administrador concedidos.",
      });
      fetchUsers();
    } catch (error) {
      console.error('Error toggling admin role:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível alterar os privilégios de administrador.",
      });
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Administração de Usuários</h1>
          <Button 
            onClick={fetchUsers}
            variant="outline" 
            disabled={loading}
          >
            Atualizar Lista
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Gerencie os usuários, aprove novas contas e defina administradores
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable 
              users={users}
              loading={loading}
              onApprove={approveUser}
              onRemoveApproval={removeApproval}
              onToggleAdmin={toggleAdmin}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Admin;
