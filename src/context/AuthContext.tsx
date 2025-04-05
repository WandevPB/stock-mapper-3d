
import React, { createContext, useState, useEffect, useContext } from 'react';
import { useToast } from '@/hooks/use-toast';

// Simple User type without Supabase
interface User {
  id: string;
  username: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin credentials
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAdmin(parsedUser.isAdmin);
    }
    setIsLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Simple validation for admin user
      if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        const adminUser = {
          id: '1',
          username: ADMIN_USERNAME,
          isAdmin: true
        };
        
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(adminUser));
        
        // Update state
        setUser(adminUser);
        setIsAdmin(true);
        
        toast({
          title: "Login bem-sucedido",
          description: "Você está conectado ao sistema como administrador.",
        });
      } else {
        throw new Error("Credenciais inválidas");
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Credenciais inválidas.",
      });
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Remove user from localStorage
      localStorage.removeItem('user');
      
      // Clear state
      setUser(null);
      setIsAdmin(false);
      
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
        isAdmin,
        isLoading,
        signIn,
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
