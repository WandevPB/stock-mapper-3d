
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useInventory } from '@/context/InventoryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { ArrowRight, ArrowDownUp, PackagePlus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const Movements = () => {
  const { movements, getItemById } = useInventory();

  const sortedMovements = [...movements].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const formatAddress = (address: { rua: string; bloco: string; altura: string; lado: string }) => {
    return `${address.rua}-${address.bloco}-${address.altura}-${address.lado}`;
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'add':
        return <PackagePlus className="h-5 w-5" />;
      case 'move':
        return <ArrowDownUp className="h-5 w-5" />;
      case 'remove':
        return <Trash2 className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getMovementBadge = (type: string) => {
    switch (type) {
      case 'add':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            Added
          </Badge>
        );
      case 'move':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Moved
          </Badge>
        );
      case 'remove':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Removed
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <PageLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold title-gradient">Movement History</h1>
          <p className="text-muted-foreground mt-1">Track all inventory movements and changes</p>
        </div>

        <div className="space-y-4">
          {sortedMovements.length > 0 ? (
            sortedMovements.map((movement) => {
              const item = getItemById(movement.itemId);
              if (!item) return null;

              return (
                <Card key={movement.id} className="glass-card animate-hover">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={cn(
                          "rounded-full p-2",
                          movement.type === 'add' ? "bg-green-100" : 
                          movement.type === 'move' ? "bg-blue-100" : "bg-red-100"
                        )}>
                          {getMovementIcon(movement.type)}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{item.name}</h3>
                            {getMovementBadge(movement.type)}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">SAP Code: {item.codSAP}</p>
                          
                          {movement.type === 'move' && movement.fromAddress && movement.toAddress && (
                            <div className="flex items-center text-sm mt-1">
                              <span className="text-muted-foreground">
                                {formatAddress(movement.fromAddress)}
                              </span>
                              <ArrowRight className="h-3 w-3 mx-2 text-muted-foreground" />
                              <span>{formatAddress(movement.toAddress)}</span>
                            </div>
                          )}
                          
                          {movement.type === 'add' && movement.toAddress && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Location: </span>
                              {formatAddress(movement.toAddress)}
                            </p>
                          )}
                          
                          {movement.type === 'remove' && movement.fromAddress && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">From: </span>
                              {formatAddress(movement.fromAddress)}
                            </p>
                          )}
                          
                          {movement.quantity !== undefined && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Quantity: </span>
                              {movement.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {format(new Date(movement.timestamp), 'MMM d, yyyy')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(movement.timestamp), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card className="glass-card">
              <CardHeader className="text-center py-10">
                <CardTitle className="text-muted-foreground text-xl font-normal">
                  No movement history yet
                </CardTitle>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Movements;
