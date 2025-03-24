
import React from 'react';
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

  const onSubmit = (data: FormValues) => {
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

    if (isEditing && item) {
      updateItem(item.id, itemData);
    } else {
      addItem(itemData);
    }

    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <Card className="glass-card w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-inventory-orange text-center">
          {isEditing ? 'Edit Item' : 'Register New Item'}
        </CardTitle>
        <CardDescription className="text-center">
          {isEditing 
            ? 'Update the information for this inventory item' 
            : 'Fill in the details to add a new item to inventory'}
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
                    <FormLabel>SAP Code</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SAP code" {...field} />
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
                    <FormLabel>Quantity (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter quantity" {...field} />
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
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter item name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <h3 className="text-sm font-medium">Location Address</h3>
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
                            <SelectValue placeholder="Select side" />
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
                >
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                className="bg-inventory-orange hover:bg-inventory-orange-dark"
              >
                {isEditing ? 'Update Item' : 'Add Item'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default InventoryForm;
