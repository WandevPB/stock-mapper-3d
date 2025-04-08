import React, { useState, useEffect } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, RefreshCw, AlertTriangle, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import InventoryForm from '@/components/inventory/InventoryForm';
import InventoryItem from '@/components/inventory/InventoryItem';
import MoveItemForm from '@/components/inventory/MoveItemForm';
import { InventoryItem as InventoryItemType } from '@/types/inventory';
import { useInventory } from '@/context/InventoryContext';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { SheetsService, SHEET_API_URL } from '@/services/SheetsService';
import { useToast } from '@/hooks/use-toast';
import { isOfflineMode, checkSupabaseConnection } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

const Inventory = () => {
  const { items, isLoading, isError, refreshData } = useInventory();
  const [searchQuery, setSearchQuery] = useState('');
  const [openItemModal, setOpenItemModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItemType | null>(null);
  const [moveItemModalOpen, setMoveItemModalOpen] = useState(false);
  const [itemToMove, setItemToMove] = useState<InventoryItemType | null>(null);
  const [sheetsConfigured, setSheetsConfigured] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const { toast } = useToast();

  useEffect(() => {
    // Check if Google Sheets API URL has been configured
    const isConfigured = !SHEET_API_URL.includes('YOUR_SCRIPT_ID');
    setSheetsConfigured(isConfigured);
    
    if (!isConfigured) {
      toast({
        variant: "destructive",
        title: "Configuração Necessária",
        description: "É necessário configurar a API do Google Sheets no arquivo SheetsService.ts",
      });
    }
    
    // Verificar status de conexão
    const checkConnection = async () => {
      setConnectionStatus('checking');
      const isConnected = await checkSupabaseConnection();
      setConnectionStatus(isConnected ? 'online' : 'offline');
    };
    
    checkConnection();
    
    // Verificar a cada 30 segundos
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, [toast]);

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.codSAP.toLowerCase().includes(query) ||
      `${item.address.rua}-${item.address.bloco}-${item.address.altura}-${item.address.lado}`.toLowerCase().includes(query)
    );
  });

  const handleEditItem = (item: InventoryItemType) => {
    setSelectedItem(item);
    setOpenItemModal(true);
  };

  const handleMoveItem = (item: InventoryItemType) => {
    setItemToMove(item);
    setMoveItemModalOpen(true);
  };

  const handleAddSuccess = () => {
    setOpenItemModal(false);
    setSelectedItem(null);
  };

  const handleMoveSuccess = () => {
    setMoveItemModalOpen(false);
    setItemToMove(null);
  };
  
  const handleConnectionCheck = async () => {
    setConnectionStatus('checking');
    const isConnected = await checkSupabaseConnection();
    setConnectionStatus(isConnected ? 'online' : 'offline');
    
    toast({
      title: isConnected ? "Conexão Estabelecida" : "Modo Offline",
      description: isConnected 
        ? "Sistema está conectado à base de dados." 
        : "Sistema operando em modo offline. Dados serão sincronizados quando a conexão for restaurada.",
      variant: isConnected ? "default" : "destructive",
    });
    
    if (isConnected) {
      refreshData();
    }
  };

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(6).fill(0).map((_, index) => (
      <Card key={index} className="glass-card h-full shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <div className="flex justify-between pt-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        {connectionStatus === 'offline' && (
          <Alert variant="destructive" className="mb-6">
            <WifiOff className="h-4 w-4" />
            <AlertTitle>Modo Offline Ativo</AlertTitle>
            <AlertDescription>
              O sistema está operando em modo offline. Os dados são armazenados localmente e serão sincronizados quando a conexão com o servidor for restaurada.
              <Button 
                variant="outline" 
                size="sm" 
                className="ml-2 mt-2" 
                onClick={handleConnectionCheck}
              >
                Verificar Conexão
              </Button>
            </AlertDescription>
          </Alert>
        )}
      
        {!sheetsConfigured && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Atenção</AlertTitle>
            <AlertDescription>
              É necessário configurar a API do Google Sheets antes de utilizar o sistema. 
              O código do App Script está disponível no console do desenvolvedor.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-inventory-orange">Inventário</h1>
            {connectionStatus === 'online' ? (
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                <Wifi className="h-3 w-3 mr-1" />
                Online
              </Badge>
            ) : connectionStatus === 'offline' ? (
              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                <WifiOff className="h-3 w-3 mr-1" />
                Offline
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Verificando
              </Badge>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              onClick={refreshData} 
              className="hidden sm:flex"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Dialog open={openItemModal} onOpenChange={setOpenItemModal}>
              <DialogTrigger asChild>
                <Button className="bg-inventory-orange hover:bg-inventory-orange-dark w-full sm:w-auto gap-2">
                  <PlusCircle className="h-4 w-4" />
                  <span>Adicionar Item</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>{selectedItem ? 'Editar Item' : 'Adicionar Novo Item'}</DialogTitle>
                  <DialogDescription>
                    {selectedItem 
                      ? 'Edite os detalhes do item selecionado' 
                      : 'Preencha os detalhes para adicionar um novo item ao inventário'}
                  </DialogDescription>
                </DialogHeader>
                <InventoryForm 
                  item={selectedItem || undefined} 
                  onSuccess={handleAddSuccess} 
                  onCancel={() => setOpenItemModal(false)}
                />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            renderSkeletons()
          ) : isError ? (
            <div className="col-span-full p-8 text-center">
              <p className="text-destructive">
                Ocorreu um erro ao carregar os itens. Por favor, tente novamente.
              </p>
              <Button 
                onClick={refreshData} 
                variant="outline" 
                className="mt-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full p-8 text-center">
              <p className="text-muted-foreground">
                {searchQuery ? 'Nenhum item encontrado para a busca.' : 'Nenhum item no inventário. Adicione um item para começar.'}
              </p>
            </div>
          ) : (
            filteredItems.map(item => (
              <InventoryItem 
                key={item.id} 
                item={item} 
                onEdit={handleEditItem}
                onMove={handleMoveItem}
              />
            ))
          )}
        </div>

        <Dialog open={moveItemModalOpen} onOpenChange={setMoveItemModalOpen}>
          <DialogContent className="max-w-md sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Mover Item</DialogTitle>
              <DialogDescription>
                Defina a nova localização do item selecionado
              </DialogDescription>
            </DialogHeader>
            {itemToMove && (
              <MoveItemForm 
                item={itemToMove} 
                onSuccess={handleMoveSuccess} 
                onCancel={() => setMoveItemModalOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </PageLayout>
  );
};

export default Inventory;
