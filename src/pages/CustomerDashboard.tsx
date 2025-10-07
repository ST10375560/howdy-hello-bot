import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Shield, LogOut, Send, DollarSign } from "lucide-react";
import { paymentSchema, PaymentInput } from "@/lib/validations";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payee_name: string;
  swift_code: string;
  status: string;
  created_at: string;
}

const CustomerDashboard = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customerData, setCustomerData] = useState<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<PaymentInput>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      provider: "SWIFT",
    },
  });

  useEffect(() => {
    if (user) {
      fetchCustomerData();
      fetchPayments();
    }
  }, [user]);

  const fetchCustomerData = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (!error) setCustomerData(data);
  };

  const fetchPayments = async () => {
    const { data: customer } = await supabase
      .from("customers")
      .select("id")
      .eq("user_id", user!.id)
      .single();

    if (customer) {
      const { data } = await supabase
        .from("payments")
        .select("*")
        .eq("customer_id", customer.id)
        .order("created_at", { ascending: false });

      if (data) setPayments(data);
    }
  };

  const onSubmit = async (data: PaymentInput) => {
    setIsLoading(true);
    
    try {
      const { data: customer } = await supabase
        .from("customers")
        .select("id")
        .eq("user_id", user!.id)
        .single();

      if (!customer) throw new Error("Customer profile not found");

      const { error } = await supabase.from("payments").insert({
        customer_id: customer.id,
        amount: parseFloat(data.amount),
        currency: data.currency,
        provider: data.provider,
        payee_name: data.payeeName,
        payee_account_number: data.payeeAccountNumber,
        swift_code: data.swiftCode,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Payment submitted!",
        description: "Your international payment has been submitted for verification.",
      });

      reset();
      fetchPayments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "An error occurred while processing your payment",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      pending: "default",
      verified: "secondary",
      submitted_to_swift: "secondary",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <Shield className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SecurBank International</h1>
              <p className="text-sm text-muted-foreground">Customer Portal</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {customerData && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Welcome, {customerData.full_name}</CardTitle>
              <CardDescription>Account: {customerData.account_number}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Card className="shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              <CardTitle>New International Payment</CardTitle>
            </div>
            <CardDescription>Make a secure payment via SWIFT</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    placeholder="1000.00"
                    {...register("amount")}
                    disabled={isLoading}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Select onValueChange={(value) => setValue("currency", value as any)} disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                      <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                      <SelectItem value="CNY">CNY - Chinese Yuan</SelectItem>
                      <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.currency && (
                    <p className="text-sm text-destructive">{errors.currency.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payeeName">Payee Name</Label>
                  <Input
                    id="payeeName"
                    placeholder="John Doe"
                    {...register("payeeName")}
                    disabled={isLoading}
                  />
                  {errors.payeeName && (
                    <p className="text-sm text-destructive">{errors.payeeName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payeeAccountNumber">Payee Account Number</Label>
                  <Input
                    id="payeeAccountNumber"
                    placeholder="9876543210"
                    {...register("payeeAccountNumber")}
                    disabled={isLoading}
                  />
                  {errors.payeeAccountNumber && (
                    <p className="text-sm text-destructive">{errors.payeeAccountNumber.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="swiftCode">SWIFT Code</Label>
                  <Input
                    id="swiftCode"
                    placeholder="ABCDEF12"
                    {...register("swiftCode")}
                    disabled={isLoading}
                    className="uppercase"
                  />
                  {errors.swiftCode && (
                    <p className="text-sm text-destructive">{errors.swiftCode.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="provider">Provider</Label>
                  <Input
                    id="provider"
                    value="SWIFT"
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                <DollarSign className="mr-2 h-5 w-5" />
                {isLoading ? "Processing..." : "Pay Now"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
            <CardDescription>View your international payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>SWIFT Code</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      No payments yet
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.payee_name}</TableCell>
                      <TableCell>{payment.amount.toFixed(2)}</TableCell>
                      <TableCell>{payment.currency}</TableCell>
                      <TableCell className="font-mono">{payment.swift_code}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default CustomerDashboard;
