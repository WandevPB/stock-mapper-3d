
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
  createUser: (username: string, password: string, isAdminUser: boolean) => Promise<void>;
  users: User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hardcoded admin credentials - changed as requested
const ADMIN_USERNAME = 'wanderson';
const ADMIN_PASSWORD = 'admin123';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [users, setUsers] = useState<User[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // Check for user in localStorage on initial load
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      setIsAdmin(parsedUser.isAdmin);
    }

    // Load users from localStorage
    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      // Initialize with admin user if no users exist
      const initialUsers = [
        {
          id: '1',
          username: ADMIN_USERNAME,
          isAdmin: true
        }
      ];
      localStorage.setItem('users', JSON.stringify(initialUsers));
      setUsers(initialUsers);
    }
    
    setIsLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      // Check admin credentials
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
        return;
      }
      
      // Check other users
      const foundUser = users.find(u => u.username === username);
      if (foundUser) {
        // In a real app we would check password hash, but for simplicity:
        // (This is just a mock implementation)
        
        // Save user to localStorage
        localStorage.setItem('user', JSON.stringify(foundUser));
        
        // Update state
        setUser(foundUser);
        setIsAdmin(foundUser.isAdmin);
        
        toast({
          title: "Login bem-sucedido",
          description: foundUser.isAdmin 
            ? "Você está conectado ao sistema como administrador."
            : "Você está conectado ao sistema.",
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

  const createUser = async (username: string, password: string, isAdminUser: boolean) => {
    try {
      // Check if username already exists
      if (users.some(u => u.username === username)) {
        throw new Error("Nome de usuário já existe");
      }
      
      // Create new user
      const newUser = {
        id: `user_${Date.now()}`, // Simple ID generation
        username,
        isAdmin: isAdminUser
      };
      
      // Add to users array
      const updatedUsers = [...users, newUser];
      setUsers(updatedUsers);
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      
      toast({
        title: "Usuário criado",
        description: `O usuário ${username} foi criado com sucesso.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar usuário",
        description: error.message || "Não foi possível criar o usuário.",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        signIn,
        signOut,
        createUser,
        users
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
