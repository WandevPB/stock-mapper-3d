
import React, { useState, useMemo } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useInventory } from '@/context/InventoryContext';
import WarehouseVisualization from '@/components/visualization/WarehouseVisualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BoxesIcon, PackageCheck, PackageSearch, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import InventoryForm from '@/components/inventory/InventoryForm';
import { Address } from '@/types/inventory';
import { useIsMobile } from '@/hooks/use-mobile';

const StatCard = ({ title, value, icon, className }: { title: string; value: number; icon: React.ReactNode; className?: string }) => (
  <Card className={`glass-card animate-hover ${className}`}>
    <CardContent className="p-6 flex justify-between items-center">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <h3 className="text-2xl font-bold">{value}</h3>
      </div>
      <div className="h-12 w-12 rounded-full bg-inventory-orange/10 flex items-center justify-center text-inventory-orange">
        {icon}
      </div>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { items, movements } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const isMobile = useIsMobile();

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  // Implementar a lógica de filtrar itens por endereço aqui
  const itemsAtAddress = useMemo(() => {
    if (!selectedAddress) return [];
    
    return items.filter(item => 
      item.address.rua === selectedAddress.rua &&
      item.address.bloco === selectedAddress.bloco &&
      item.address.altura === selectedAddress.altura &&
      item.address.lado === selectedAddress.lado
    );
  }, [items, selectedAddress]);

  const lastMovements = [...movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <PageLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold title-gradient">Painel de Controle</h1>
          <p className="text-muted-foreground mt-1">Monitore e gerencie seu estoque facilmente</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            title="Total de Itens" 
            value={items.length} 
            icon={<BoxesIcon className="h-6 w-6" />} 
          />
          <StatCard 
            title="Itens com Quantidade" 
            value={items.filter(item => item.quantity !== undefined).length} 
            icon={<PackageCheck className="h-6 w-6" />} 
          />
          <StatCard 
            title="Movimentações Recentes" 
            value={lastMovements.length} 
            icon={<Move className="h-6 w-6" />} 
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-2xl font-medium text-inventory-orange">Visualização do Depósito</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-inventory-orange hover:bg-inventory-orange-dark">
                Novo Item
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-card">
              <InventoryForm onSuccess={() => setIsDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <WarehouseVisualization 
              onSelectAddress={handleAddressSelect} 
              activeAddress={selectedAddress}
            />
          </div>
          
          <div>
            {selectedAddress ? (
              <Card className="glass-card h-full">
                <CardHeader>
                  <CardTitle className="text-inventory-orange text-xl">
                    Detalhes da Localização
                  </CardTitle>
                  <CardDescription>
                    {`${selectedAddress.rua}-${selectedAddress.bloco}-${selectedAddress.altura}-${selectedAddress.lado}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsAtAddress.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm font-medium">{itemsAtAddress.length} {itemsAtAddress.length === 1 ? 'item' : 'itens'} nesta localização</p>
                      <div className="divide-y">
                        {itemsAtAddress.map(item => (
                          <div key={item.id} className="py-2">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">SAP: {item.codSAP}</p>
                            <p className="text-sm">
                              Quantidade: {item.quantity !== undefined ? item.quantity : 'Não contado'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <PackageSearch className="h-10 w-10 mb-2" />
                      <p>Nenhum item nesta localização</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card h-full">
                <CardHeader>
                  <CardTitle className="text-inventory-orange text-xl">
                    Detalhes da Localização
                  </CardTitle>
                  <CardDescription>
                    Selecione uma localização para ver detalhes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <PackageSearch className="h-10 w-10 mb-2" />
                    <p>Clique em uma prateleira na visualização</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Dashboard;
