
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, ArrowRight, PlusCircle, MoveIcon, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useInventory } from '@/context/InventoryContext';
import { Skeleton } from '@/components/ui/skeleton';

const Movements = () => {
  const { movements, isLoading, isError, refreshData } = useInventory();

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    return `${address.rua}-${address.bloco}-${address.altura}-${address.lado}`;
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  const getMovementTypeDetails = (type: 'add' | 'move' | 'remove') => {
    switch (type) {
      case 'add':
        return {
          label: 'Entrada',
          icon: <PlusCircle className="h-4 w-4" />,
          color: 'bg-green-100 text-green-800'
        };
      case 'move':
        return {
          label: 'Movimentação',
          icon: <MoveIcon className="h-4 w-4" />,
          color: 'bg-blue-100 text-blue-800'
        };
      case 'remove':
        return {
          label: 'Saída',
          icon: <Trash2 className="h-4 w-4" />,
          color: 'bg-red-100 text-red-800'
        };
      default:
        return {
          label: 'Desconhecido',
          icon: null,
          color: 'bg-gray-100 text-gray-800'
        };
    }
  };

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-inventory-orange">Movimentações</h1>
          <Button 
            variant="outline" 
            onClick={refreshData} 
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array(5).fill(0).map((_, index) => (
              <Card key={index} className="glass-card">
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-20 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-10">
            <p className="text-destructive mb-4">Ocorreu um erro ao carregar as movimentações.</p>
            <Button 
              onClick={refreshData} 
              variant="outline" 
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        ) : movements.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">Nenhuma movimentação registrada.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {movements.map((movement) => {
              const typeDetails = getMovementTypeDetails(movement.type);
              
              return (
                <Card key={movement.id} className="glass-card animate-hover">
                  <CardContent className="py-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <Badge className={`px-3 py-1 ${typeDetails.color} flex items-center gap-1`}>
                        {typeDetails.icon}
                        {typeDetails.label}
                      </Badge>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-base">
                          Item: {movement.itemId}
                        </h3>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          {movement.type === 'add' ? (
                            <span>Adicionado em {formatAddress(movement.toAddress)}</span>
                          ) : movement.type === 'remove' ? (
                            <span>Removido de {formatAddress(movement.fromAddress)}</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span>{formatAddress(movement.fromAddress)}</span>
                              <ArrowRight className="h-3 w-3" />
                              <span>{formatAddress(movement.toAddress)}</span>
                            </div>
                          )}
                          
                          {movement.quantity !== undefined && (
                            <span className="ml-2">
                              Qtd: {movement.quantity}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(movement.timestamp)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default Movements;
