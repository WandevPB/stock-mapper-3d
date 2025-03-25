
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, UserCheck, UserX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

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
      
      // Get all users from auth.users
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;
      
      // Get approved users and admins
      const { data: approvedUsers, error: approvedError } = await supabase
        .from('user_approvals')
        .select('user_id, is_approved');
        
      if (approvedError) throw approvedError;
      
      const { data: adminUsers, error: adminError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
        
      if (adminError) throw adminError;
      
      // Map to a more usable format
      const approvedMap = new Map(approvedUsers?.map(u => [u.user_id, u.is_approved]));
      const adminMap = new Set(adminUsers?.map(u => u.user_id));
      
      const formattedUsers = authUsers.users.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.user_metadata?.name || '',
        created_at: user.created_at,
        is_approved: approvedMap.get(user.id) || false,
        is_admin: adminMap.has(user.id)
      }));
      
      setUsers(formattedUsers);
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
      const { error } = await supabase
        .from('user_approvals')
        .upsert({ user_id: userId, is_approved: true });
        
      if (error) throw error;
      
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
      const { error } = await supabase
        .from('user_approvals')
        .upsert({ user_id: userId, is_approved: false });
        
      if (error) throw error;
      
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
      if (isCurrentlyAdmin) {
        // Remove admin role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Privilégios de administrador removidos.",
        });
      } else {
        // Add admin role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: 'admin' });
          
        if (error) throw error;
        
        toast({
          title: "Sucesso",
          description: "Privilégios de administrador concedidos.",
        });
      }
      
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
            {loading ? (
              <div className="py-8 text-center">Carregando usuários...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Data de Criação</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Nenhum usuário encontrado
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{format(new Date(user.created_at), 'dd/MM/yyyy')}</TableCell>
                        <TableCell>
                          {user.is_admin ? (
                            <span className="flex items-center text-blue-600">
                              <Shield className="mr-1 h-4 w-4" /> Admin
                            </span>
                          ) : user.is_approved ? (
                            <span className="flex items-center text-green-600">
                              <UserCheck className="mr-1 h-4 w-4" /> Aprovado
                            </span>
                          ) : (
                            <span className="flex items-center text-amber-600">
                              <UserX className="mr-1 h-4 w-4" /> Pendente
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            {!user.is_approved ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600"
                                onClick={() => approveUser(user.id)}
                              >
                                Aprovar
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-amber-600"
                                onClick={() => removeApproval(user.id)}
                              >
                                Revogar
                              </Button>
                            )}
                            <Button
                              variant={user.is_admin ? "destructive" : "outline"}
                              size="sm"
                              onClick={() => toggleAdmin(user.id, user.is_admin)}
                            >
                              {user.is_admin ? "Remover Admin" : "Tornar Admin"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Admin;
