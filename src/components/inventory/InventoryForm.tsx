
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem } from '@/types/inventory';
import { SheetsService } from '@/services/SheetsService';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  codSAP: z.string().min(1, { message: "SAP code is required" }),
  name: z.string().min(1, { message: "Item name is required" }),
  quantity: z.string().optional(),
  rua: z.string().min(1, { message: "Rua is required" }),
  bloco: z.string().min(1, { message: "Bloco is required" }),
  altura: z.string().min(1, { message: "Altura is required" }),
  lado: z.enum(["A", "B"], { message: "Side must be A or B" }),
});

type FormValues = z.infer<typeof formSchema>;

interface InventoryFormProps {
  item?: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const InventoryForm: React.FC<InventoryFormProps> = ({ item, onSuccess, onCancel }) => {
  const { addItem, updateItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const isEditing = !!item;

  const defaultValues: FormValues = {
    codSAP: item?.codSAP || '',
    name: item?.name || '',
    quantity: item?.quantity?.toString() || '',
    rua: item?.address.rua || '',
    bloco: item?.address.bloco || '',
    altura: item?.address.altura || '',
    lado: item?.address.lado || 'A',
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    const itemData = {
      codSAP: data.codSAP,
      name: data.name,
      quantity: data.quantity ? parseInt(data.quantity) : undefined,
      address: {
        rua: data.rua,
        bloco: data.bloco,
        altura: data.altura,
        lado: data.lado as 'A' | 'B',
      },
    };

    try {
      let success = false;
      
      if (isEditing && item) {
        // Update in local state
        await updateItem(item.id, itemData);
        
        // Update in Google Sheets
        const updatedItem = { 
          ...item, 
          ...itemData, 
          address: itemData.address 
        };
        
        success = await SheetsService.updateItemInSheet(updatedItem);
        
        if (success) {
          toast({
            title: "Item atualizado",
            description: "Item atualizado com sucesso no inventário e na planilha.",
          });
        } else {
          toast({
            variant: "destructive",
            title: "Erro na sincronização",
            description: "O item foi atualizado localmente, mas houve um erro ao sincronizar com a planilha.",
          });
        }
      } else {
        // Add to local state first
        const newItem = await addItem(itemData);
        
        // Add to Google Sheets
        if (newItem) {
          success = await SheetsService.addItemToSheet(newItem);
          
          if (success) {
            toast({
              title: "Item adicionado",
              description: "Item adicionado com sucesso ao inventário e à planilha.",
            });
          } else {
            toast({
              variant: "destructive",
              title: "Erro na sincronização",
              description: "O item foi adicionado localmente, mas houve um erro ao sincronizar com a planilha.",
            });
          }
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error("Error submitting inventory form:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: `Ocorreu um erro ao processar a operação: ${error.message || "Erro desconhecido"}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="glass-card w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-inventory-orange text-center">
          {isEditing ? 'Editar Item' : 'Registrar Novo Item'}
        </CardTitle>
        <CardDescription className="text-center">
          {isEditing 
            ? 'Atualize as informações deste item do inventário' 
            : 'Preencha os detalhes para adicionar um novo item ao inventário'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="codSAP"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código SAP</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o código SAP" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade (Opcional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Digite a quantidade" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Item</FormLabel>
                  <FormControl>
                    <Input placeholder="Digite o nome do item" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Endereço de Localização</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="rua"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rua</FormLabel>
                      <FormControl>
                        <Input placeholder="Rua" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bloco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bloco</FormLabel>
                      <FormControl>
                        <Input placeholder="Bloco" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="altura"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Altura</FormLabel>
                      <FormControl>
                        <Input placeholder="Altura" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lado"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lado</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o lado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A">A</SelectItem>
                          <SelectItem value="B">B</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <CardFooter className="flex justify-end space-x-2 px-0 pt-4">
              {onCancel && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
              )}
              <Button 
                type="submit" 
                className="bg-inventory-orange hover:bg-inventory-orange-dark"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? 'Atualizando...' : 'Adicionando...'}
                  </>
                ) : (
                  isEditing ? 'Atualizar Item' : 'Adicionar Item'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InventoryForm;
