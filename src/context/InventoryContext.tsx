
import React, { createContext, useContext, useState, useEffect } from 'react';
import { InventoryItem, Address, Movement } from '@/types/inventory';
import { SupabaseService } from '@/services/SupabaseService';
import { toast } from '@/components/ui/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface InventoryContextType {
  items: InventoryItem[];
  movements: Movement[];
  isLoading: boolean;
  isError: boolean;
  addItem: (item: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItem: (id: string, item: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  moveItem: (id: string, newAddress: Address, quantity?: number) => Promise<void>;
  searchItems: (query: string) => Promise<InventoryItem[]>;
  refreshData: () => void;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();

  // Fetch inventory items
  const { 
    data: items = [], 
    isLoading: isItemsLoading, 
    isError: isItemsError,
    refetch: refetchItems
  } = useQuery({
    queryKey: ['inventoryItems'],
    queryFn: SupabaseService.fetchInventoryItems
  });

  // Fetch movements
  const { 
    data: movements = [], 
    isLoading: isMovementsLoading, 
    isError: isMovementsError,
    refetch: refetchMovements
  } = useQuery({
    queryKey: ['movements'],
    queryFn: SupabaseService.fetchMovements
  });

  // Add item mutation
  const addItemMutation = useMutation({
    mutationFn: SupabaseService.addInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast({
        title: "Item adicionado",
        description: "O item foi adicionado com sucesso ao inventário.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível adicionar o item: ${error.message}`,
      });
    }
  });

  // Update item mutation
  const updateItemMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: any }) => 
      SupabaseService.updateInventoryItem(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      toast({
        title: "Item atualizado",
        description: "O item foi atualizado com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível atualizar o item: ${error.message}`,
      });
    }
  });

  // Delete item mutation
  const deleteItemMutation = useMutation({
    mutationFn: SupabaseService.deleteInventoryItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast({
        title: "Item removido",
        description: "O item foi removido com sucesso do inventário.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível remover o item: ${error.message}`,
      });
    }
  });

  // Move item mutation
  const moveItemMutation = useMutation({
    mutationFn: ({ id, newAddress, quantity }: { id: string, newAddress: Address, quantity?: number }) => 
      SupabaseService.moveInventoryItem(id, newAddress, quantity),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventoryItems'] });
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      toast({
        title: "Item movido",
        description: "O item foi movido com sucesso para o novo endereço.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Não foi possível mover o item: ${error.message}`,
      });
    }
  });

  const isLoading = isItemsLoading || isMovementsLoading;
  const isError = isItemsError || isMovementsError;

  const addItem = async (newItem: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    await addItemMutation.mutateAsync(newItem);
  };

  const updateItem = async (id: string, updates: Partial<Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>>) => {
    await updateItemMutation.mutateAsync({ id, updates });
  };

  const deleteItem = async (id: string) => {
    await deleteItemMutation.mutateAsync(id);
  };

  const moveItem = async (id: string, newAddress: Address, quantity?: number) => {
    await moveItemMutation.mutateAsync({ id, newAddress, quantity });
  };

  const searchItems = async (query: string): Promise<InventoryItem[]> => {
    try {
      return await SupabaseService.searchInventoryItems(query);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na busca",
        description: `Não foi possível buscar itens: ${error.message}`,
      });
      return [];
    }
  };

  const refreshData = () => {
    refetchItems();
    refetchMovements();
    toast({
      title: "Dados atualizados",
      description: "Os dados do inventário foram atualizados.",
    });
  };

  const value = {
    items,
    movements,
    isLoading,
    isError,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    searchItems,
    refreshData
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = (): InventoryContextType => {
  const context = useContext(InventoryContext);
  if (context === undefined) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
