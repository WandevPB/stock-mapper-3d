
import React, { useState } from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useInventory } from '@/context/InventoryContext';
import WarehouseVisualization from '@/components/visualization/WarehouseVisualization';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BoxesIcon, PackageCheck, PackageSearch, Move } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import InventoryForm from '@/components/inventory/InventoryForm';
import { Address } from '@/types/inventory';

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
  const { items, movements, getItemsByAddress } = useInventory();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

  const handleAddressSelect = (address: Address) => {
    setSelectedAddress(address);
  };

  const itemsAtAddress = selectedAddress ? getItemsByAddress(selectedAddress) : [];

  const lastMovements = [...movements]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 5);

  return (
    <PageLayout>
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold title-gradient">Inventory Dashboard</h1>
          <p className="text-muted-foreground mt-1">Monitor and manage your inventory at a glance</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Items" 
            value={items.length} 
            icon={<BoxesIcon className="h-6 w-6" />} 
          />
          <StatCard 
            title="Items with Quantity" 
            value={items.filter(item => item.quantity !== undefined).length} 
            icon={<PackageCheck className="h-6 w-6" />} 
          />
          <StatCard 
            title="Recent Movements" 
            value={lastMovements.length} 
            icon={<Move className="h-6 w-6" />} 
          />
        </div>

        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-medium text-inventory-orange">Warehouse Visualization</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-inventory-orange hover:bg-inventory-orange-dark">
                Add New Item
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
                    Location Details
                  </CardTitle>
                  <CardDescription>
                    {`${selectedAddress.rua}-${selectedAddress.bloco}-${selectedAddress.altura}-${selectedAddress.lado}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {itemsAtAddress.length > 0 ? (
                    <div className="space-y-4">
                      <p className="text-sm font-medium">{itemsAtAddress.length} items at this location</p>
                      <div className="divide-y">
                        {itemsAtAddress.map(item => (
                          <div key={item.id} className="py-2">
                            <h4 className="font-medium">{item.name}</h4>
                            <p className="text-sm text-muted-foreground">SAP: {item.codSAP}</p>
                            <p className="text-sm">
                              Quantity: {item.quantity !== undefined ? item.quantity : 'Not counted'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                      <PackageSearch className="h-10 w-10 mb-2" />
                      <p>No items at this location</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="glass-card h-full">
                <CardHeader>
                  <CardTitle className="text-inventory-orange text-xl">
                    Location Details
                  </CardTitle>
                  <CardDescription>
                    Select a location to view details
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <PackageSearch className="h-10 w-10 mb-2" />
                    <p>Click on a shelf in the visualization</p>
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
