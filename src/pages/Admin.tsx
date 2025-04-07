
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { UserPlus } from 'lucide-react';
import UserTable from '@/components/admin/UserTable';

const userSchema = z.object({
  username: z.string().min(3, 'Nome de usuário deve ter pelo menos 3 caracteres'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  isAdmin: z.boolean().default(false),
});

type UserFormValues = z.infer<typeof userSchema>;

const Admin = () => {
  const { user, isAdmin, users, createUser } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const form = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      username: '',
      password: '',
      isAdmin: false,
    },
  });

  React.useEffect(() => {
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
  }, [user, isAdmin, navigate, toast]);

  const onSubmit = async (data: UserFormValues) => {
    setLoading(true);
    try {
      await createUser(data.username, data.password, data.isAdmin);
      form.reset();
      setDialogOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    toast({
      title: "Informação",
      description: "Todos os usuários já são aprovados automaticamente neste sistema.",
    });
  };

  const handleRemoveApproval = async (userId: string) => {
    toast({
      title: "Informação",
      description: "A funcionalidade de remoção de aprovação não está disponível nesta versão.",
    });
  };

  const handleToggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    toast({
      title: "Informação",
      description: "Para alterar privilégios de administrador, crie um novo usuário com as permissões desejadas.",
    });
  };

  return (
    <PageLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Administração de Usuários</h1>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-inventory-orange hover:bg-inventory-orange-dark">
                <UserPlus className="mr-2 h-4 w-4" /> Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Crie uma nova conta de usuário para o sistema.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="username"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome de usuário</FormLabel>
                        <FormControl>
                          <Input placeholder="novoUsuario" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Senha</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="******" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="isAdmin"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Administrador</FormLabel>
                          <FormDescription>
                            Este usuário terá acesso de administrador
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setDialogOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit"
                      className="bg-inventory-orange hover:bg-inventory-orange-dark"
                      disabled={loading}
                    >
                      {loading ? "Criando..." : "Criar Usuário"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Gerencie os usuários do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable 
              users={users.map(u => ({
                id: u.id,
                email: u.username,
                name: u.username,
                created_at: new Date().toISOString(),
                is_approved: true,
                is_admin: u.isAdmin
              }))}
              loading={loading}
              onApprove={handleApproveUser}
              onRemoveApproval={handleRemoveApproval}
              onToggleAdmin={handleToggleAdmin}
            />
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default Admin;
