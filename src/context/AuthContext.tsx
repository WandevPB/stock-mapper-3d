
import React, { createContext, useState, useEffect, useContext } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, userManagement } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lista de emails que devem ser administradores por padrão
const DEFAULT_ADMIN_EMAILS = ['admin@cdpb.com'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          checkUserAdmin(session.user.id);
        } else {
          setIsAdmin(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        checkUserAdmin(session.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Função para verificar se o usuário deve ser admin padrão
  const isDefaultAdmin = (email: string): boolean => {
    return DEFAULT_ADMIN_EMAILS.includes(email.toLowerCase());
  };

  const checkUserAdmin = async (userId: string | undefined) => {
    if (!userId) {
      setIsAdmin(false);
      return;
    }

    try {
      // Também verifica o email do usuário para identificar admin padrão
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      
      if (userData?.user && isDefaultAdmin(userData.user.email || '')) {
        setIsAdmin(true);
        return;
      }
      
      const { data, error } = await userManagement.getUserRoles(userId);
      
      if (error) throw error;
      
      // Check if user has admin role
      setIsAdmin(data?.some(role => role.role === 'admin') || false);
    } catch (error) {
      console.error('Error checking admin role:', error);
      // Se não conseguir verificar papéis, mas for email de admin padrão, considera admin
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(userId);
        if (userData?.user && isDefaultAdmin(userData.user.email || '')) {
          setIsAdmin(true);
          return;
        }
      } catch (secondError) {
        console.error('Error getting user email:', secondError);
      }
      setIsAdmin(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      // Se for admin padrão, primeiro tenta confirmar o email se necessário
      if (isDefaultAdmin(email)) {
        // Tenta login direto primeiro
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (!error) {
            toast({
              title: "Login bem-sucedido",
              description: "Você está conectado ao sistema como administrador.",
            });
            return;
          }
          
          // Se o erro não for de email não confirmado, propaga o erro
          if (!error.message.includes("Email not confirmed")) {
            throw error;
          }
          
          console.log("Admin email not confirmed, attempting to fix...");
          
          // Tenta cadastrar novamente para garantir que a conta existe
          await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name: "Administrador" },
            }
          });
          
          // Tenta login novamente
          const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          if (retryError) throw retryError;
          
          toast({
            title: "Login bem-sucedido",
            description: "Você está conectado ao sistema como administrador.",
          });
          return;
        } catch (adminError: any) {
          console.error("Erro com login de admin:", adminError);
          toast({
            variant: "destructive",
            title: "Erro ao fazer login",
            description: adminError.message || "Erro ao processar login de administrador.",
          });
          throw adminError;
        }
      } else {
        // Fluxo normal para usuários não-admin
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password
        });

        if (error) throw error;
        
        // Se não for admin padrão, verifica aprovação
        try {
          // Verificar se o usuário está aprovado
          const { data: userData } = await supabase
            .from('user_approvals')
            .select('is_approved')
            .eq('user_id', data.user?.id || '')
            .single();

          if (!userData?.is_approved) {
            toast({
              variant: "destructive",
              title: "Acesso negado",
              description: "Sua conta ainda não foi aprovada por um administrador.",
            });
            await supabase.auth.signOut();
            return;
          }
        } catch (approvalError) {
          console.error("Erro ao verificar aprovação:", approvalError);
          // Se não conseguir verificar aprovação para usuário normal, nega acesso
          await supabase.auth.signOut();
          toast({
            variant: "destructive",
            title: "Erro de verificação",
            description: "Não foi possível verificar seu status de aprovação.",
          });
          return;
        }
        
        toast({
          title: "Login bem-sucedido",
          description: "Você está conectado ao sistema.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
      });
      throw error;
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
          // Definir URL de redirecionamento para confirmação de email
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;
      
      // Se o cadastro for bem-sucedido e o email for um dos admins padrão
      if (data?.user && isDefaultAdmin(email)) {
        try {
          // Aprovar o usuário automaticamente
          await userManagement.setUserApproval(data.user.id, true);
          
          // Adicionar o papel de administrador
          await userManagement.addUserRole(data.user.id, 'admin');
          
          // Fazer login diretamente após o cadastro para administradores
          await supabase.auth.signInWithPassword({
            email,
            password
          });
          
          toast({
            title: "Conta de administrador criada",
            description: "Seu cadastro foi aprovado automaticamente com privilégios de administrador.",
          });
        } catch (roleError) {
          console.error('Erro ao configurar papel de administrador:', roleError);
        }
      } else {
        toast({
          title: "Cadastro solicitado",
          description: "Sua solicitação foi enviada para aprovação pelo administrador.",
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao cadastrar",
        description: error.message || "Não foi possível completar o cadastro.",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Desconectado",
        description: "Você saiu do sistema com sucesso.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao sair",
        description: error.message || "Não foi possível desconectar.",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        isLoading,
        signIn,
        signUp,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
