
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { InventoryItem as InventoryItemType } from '@/types/inventory';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Edit2, Trash2, Move } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useInventory } from '@/context/InventoryContext';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InventoryItemProps {
  item: InventoryItemType;
  onEdit?: (item: InventoryItemType) => void;
  onMove?: (item: InventoryItemType) => void;
}

const InventoryItem: React.FC<InventoryItemProps> = ({ item, onEdit, onMove }) => {
  const { deleteItem } = useInventory();
  
  const formatAddress = (item: InventoryItemType) => {
    const { rua, bloco, altura, lado } = item.address;
    return `${rua}-${bloco}-${altura}-${lado}`;
  };

  const formatRelativeTime = (date: Date) => {
    return formatDistanceToNow(date, { addSuffix: true, locale: ptBR });
  };

  return (
    <Card className="glass-card h-full transition-all duration-300 hover:shadow-md animate-hover">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-inventory-orange">{item.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              Adicionado {formatRelativeTime(new Date(item.createdAt))}
            </p>
          </div>
          <Badge variant="outline" className="bg-inventory-orange/10 text-inventory-orange-dark">
            SAP: {item.codSAP}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Localização:</span>
            <span className="text-sm">{formatAddress(item)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Quantidade:</span>
            <span className="text-sm">
              {item.quantity !== undefined ? item.quantity : 'Não contado'}
            </span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex justify-between">
        <TooltipProvider>
          <div className="flex space-x-2">
            {onEdit && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onEdit(item)}
                    className="text-inventory-orange-dark"
                  >
                    <Edit2 size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Editar item</p>
                </TooltipContent>
              </Tooltip>
            )}
            
            {onMove && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => onMove(item)}
                    className="text-blue-600"
                  >
                    <Move size={16} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mover item</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="outline" 
                size="icon" 
                className="text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir "{item.name}"? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => deleteItem(item.id)} 
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default InventoryItem;
