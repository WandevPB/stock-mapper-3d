
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Shield, UserCheck, UserX } from 'lucide-react';
import { format } from 'date-fns';

interface UserRowProps {
  user: {
    id: string;
    email: string;
    name: string;
    created_at: string;
    is_approved: boolean;
    is_admin: boolean;
  };
  onApprove: (userId: string) => void;
  onRemoveApproval: (userId: string) => void;
  onToggleAdmin: (userId: string, isAdmin: boolean) => void;
}

const UserRow: React.FC<UserRowProps> = ({
  user,
  onApprove,
  onRemoveApproval,
  onToggleAdmin
}) => {
  return (
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
              onClick={() => onApprove(user.id)}
            >
              Aprovar
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="text-amber-600"
              onClick={() => onRemoveApproval(user.id)}
            >
              Revogar
            </Button>
          )}
          <Button
            variant={user.is_admin ? "destructive" : "outline"}
            size="sm"
            onClick={() => onToggleAdmin(user.id, user.is_admin)}
          >
            {user.is_admin ? "Remover Admin" : "Tornar Admin"}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default UserRow;
