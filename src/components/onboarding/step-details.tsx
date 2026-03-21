
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  gender: z.string().min(1, "Gender is required"),
  age: z.coerce.number().min(1, "Age is required"),
  heightUnit: z.enum(["cm", "m", "ft-in"]),
  height: z.coerce.number().min(1, "Height is required"),
  heightInches: z.coerce.number().optional(),
  weightUnit: z.enum(["kg", "g", "lb", "oz"]),
  weight: z.coerce.number().min(1, "Weight is required"),
}).refine(data => {
  if (data.heightUnit === 'ft-in') {
    return data.heightInches !== undefined && data.heightInches >= 0;
  }
  return true;
}, {
  message: "Inches are required",
  path: ["heightInches"],
});

export function DetailsStep({ onNext }: { onNext: (data: any) => void }) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gender: "",
      age: undefined,
      heightUnit: "cm",
      height: undefined,
      heightInches: undefined,
      weightUnit: "kg",
      weight: undefined
    },
  });

  const heightUnit = form.watch("heightUnit");

  function onSubmit(values: z.infer<typeof formSchema>) {
    let heightCm = 0;
    switch (values.heightUnit) {
      case 'cm':
        heightCm = values.height;
        break;
      case 'm':
        heightCm = values.height * 100;
        break;
      case 'ft-in':
        heightCm = (values.height * 30.48) + ((values.heightInches || 0) * 2.54);
        break;
    }

    let weightKg = 0;
    switch (values.weightUnit) {
      case 'kg':
        weightKg = values.weight;
        break;
      case 'g':
        weightKg = values.weight / 1000;
        break;
      case 'lb':
        weightKg = values.weight * 0.453592;
        break;
      case 'oz':
        weightKg = values.weight * 0.0283495;
        break;
    }
    
    // Pass processed, consistent data to the next step
    onNext({
        gender: values.gender,
        age: values.age,
        heightCm: Math.round(heightCm),
        weightKg: parseFloat(weightKg.toFixed(2)),
    });
  }

  return (
    <div className="w-full max-w-md">
      <h2 className="text-2xl font-bold text-center mb-6">Tell us about yourself</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Age</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 25" {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Height Inputs */}
          <div className="space-y-2">
            <FormLabel>Height</FormLabel>
            <div className="flex gap-2">
              <div className={cn("grid gap-2", heightUnit === 'ft-in' ? 'grid-cols-2' : 'grid-cols-1 flex-1')}>
                 <FormField
                    control={form.control}
                    name="height"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input type="number" placeholder={heightUnit === 'ft-in' ? 'ft' : 'Height'} {...field} value={field.value || ''} />
                        </FormControl>
                         <FormMessage />
                      </FormItem>
                    )}
                  />
                  {heightUnit === 'ft-in' && (
                    <FormField
                      control={form.control}
                      name="heightInches"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input type="number" placeholder="in" {...field} value={field.value || ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
              </div>
               <FormField
                  control={form.control}
                  name="heightUnit"
                  render={({ field }) => (
                    <FormItem className="w-[100px]">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="m">m</SelectItem>
                          <SelectItem value="ft-in">ft/in</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
            </div>
          </div>
          
          {/* Weight Inputs */}
           <div className="space-y-2">
            <FormLabel>Weight</FormLabel>
             <div className="flex gap-2">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input type="number" placeholder="e.g., 70" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weightUnit"
                  render={({ field }) => (
                    <FormItem className="w-[100px]">
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="g">g</SelectItem>
                          <SelectItem value="lb">lb</SelectItem>
                          <SelectItem value="oz">oz</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
            </div>
          </div>
          
          <div className="flex justify-end pt-4">
            <Button type="submit">Next</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
