
import React from 'react';
import PageLayout from '@/components/layout/PageLayout';
import { useInventory } from '@/context/InventoryContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ArrowRight, ArrowDownUp, PackagePlus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

const Movements = () => {
  const { movements, getItemById } = useInventory();
  const isMobile = useIsMobile();

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
            Adicionado
          </Badge>
        );
      case 'move':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Movido
          </Badge>
        );
      case 'remove':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            Removido
          </Badge>
        );
      default:
        return null;
    }
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <PageLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-semibold title-gradient">Histórico de Movimentações</h1>
          <p className="text-muted-foreground mt-1">Acompanhe todas as movimentações e alterações no estoque</p>
        </div>

        <div className="space-y-4">
          {sortedMovements.length > 0 ? (
            sortedMovements.map((movement) => {
              const item = getItemById(movement.itemId);
              if (!item) return null;

              return (
                <Card key={movement.id} className="glass-card animate-hover">
                  <CardContent className={`p-4 ${isMobile ? 'text-sm' : 'p-6'}`}>
                    <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-start justify-between'}`}>
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
                          
                          <p className="text-sm text-muted-foreground">Código SAP: {item.codSAP}</p>
                          
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
                              <span className="text-muted-foreground">Localização: </span>
                              {formatAddress(movement.toAddress)}
                            </p>
                          )}
                          
                          {movement.type === 'remove' && movement.fromAddress && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">De: </span>
                              {formatAddress(movement.fromAddress)}
                            </p>
                          )}
                          
                          {movement.quantity !== undefined && (
                            <p className="text-sm">
                              <span className="text-muted-foreground">Quantidade: </span>
                              {movement.quantity}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className={`${isMobile ? '' : 'text-right'}`}>
                        <div className="text-sm font-medium">
                          {format(new Date(movement.timestamp), 'dd MMM, yyyy', { locale: ptBR })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatRelativeTime(new Date(movement.timestamp))}
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
                  Nenhum histórico de movimentação ainda
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
