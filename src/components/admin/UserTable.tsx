
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import UserRow from './UserRow';

interface UserTableProps {
  users: Array<{
    id: string;
    email: string;
    name: string;
    created_at: string;
    is_approved: boolean;
    is_admin: boolean;
  }>;
  loading: boolean;
  onApprove: (userId: string) => void;
  onRemoveApproval: (userId: string) => void;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  loading,
  onApprove,
  onRemoveApproval,
  onToggleAdmin
}) => {
  if (loading) {
    return <div className="py-8 text-center">Carregando usuários...</div>;
  }

  return (
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
            <UserRow
              key={user.id}
              user={user}
              onApprove={onApprove}
              onRemoveApproval={onRemoveApproval}
              onToggleAdmin={onToggleAdmin}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
};

export default UserTable;
