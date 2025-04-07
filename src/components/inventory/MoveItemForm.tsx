
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useInventory } from '@/context/InventoryContext';
import { InventoryItem } from '@/types/inventory';
import { SheetsService } from '@/services/SheetsService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  quantity: z.string().optional(),
  rua: z.string().min(1, { message: "Rua is required" }),
  bloco: z.string().min(1, { message: "Bloco is required" }),
  altura: z.string().min(1, { message: "Altura is required" }),
  lado: z.enum(["A", "B"], { message: "Side must be A or B" }),
});

type FormValues = z.infer<typeof formSchema>;

interface MoveItemFormProps {
  item: InventoryItem;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MoveItemForm: React.FC<MoveItemFormProps> = ({ item, onSuccess, onCancel }) => {
  const { moveItem } = useInventory();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const defaultValues: FormValues = {
    quantity: item.quantity?.toString() || '',
    rua: item.address.rua,
    bloco: item.address.bloco,
    altura: item.address.altura,
    lado: item.address.lado,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues,
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    
    try {
      const newAddress = {
        rua: data.rua,
        bloco: data.bloco,
        altura: data.altura,
        lado: data.lado as 'A' | 'B',
      };

      const quantity = data.quantity ? parseInt(data.quantity) : undefined;
      
      // Update in local state
      moveItem(item.id, newAddress, quantity);
      
      // Update in Google Sheets
      const success = await SheetsService.moveItemInSheet(item.id, newAddress);
      
      if (success) {
        toast({
          title: "Item movido",
          description: "Item movido com sucesso no inventário e na planilha.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Erro ao atualizar na planilha",
          description: "O item foi movido localmente, mas houve um erro ao sincronizar com a planilha.",
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error submitting move form:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao processar a movimentação.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrentAddress = (item: InventoryItem) => {
    const { rua, bloco, altura, lado } = item.address;
    return `${rua}-${bloco}-${altura}-${lado}`;
  };

  return (
    <Card className="glass-card w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-inventory-orange text-center">Mover Item</CardTitle>
        <CardDescription className="text-center">
          Mover "{item.name}" para uma nova localização
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 p-3 bg-muted rounded-md">
          <div className="text-sm">
            <p><span className="font-medium">Item:</span> {item.name}</p>
            <p><span className="font-medium">Código SAP:</span> {item.codSAP}</p>
            <p><span className="font-medium">Localização atual:</span> {formatCurrentAddress(item)}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade (Opcional)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Digite a nova quantidade" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Nova Localização</h3>
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
                    Movendo Item...
                  </>
                ) : (
                  'Mover Item'
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default MoveItemForm;
