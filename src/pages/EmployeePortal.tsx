import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, LogOut, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  payee_name: string;
  payee_account_number: string;
  swift_code: string;
  status: string;
  created_at: string;
  customers: {
    full_name: string;
    account_number: string;
  };
}

const EmployeePortal = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEmployeeData();
      fetchPayments();
    }
  }, [user]);

  const fetchEmployeeData = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .eq("user_id", user!.id)
      .single();

    if (!error) setEmployeeData(data);
  };

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        customers (
          full_name,
          account_number
        )
      `)
      .order("created_at", { ascending: false });

    if (data) setPayments(data as any);
    if (error) {
      toast({
        variant: "destructive",
        title: "Error loading payments",
        description: error.message,
      });
    }
  };

  const verifyPayment = async (paymentId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "verified",
          verified_by: employeeData.id,
          verified_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Payment verified",
        description: "The payment has been marked as verified.",
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const submitToSwift = async (paymentId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "submitted_to_swift",
        })
        .eq("id", paymentId);

      if (error) throw error;

      toast({
        title: "Submitted to SWIFT",
        description: "The payment has been successfully submitted to SWIFT.",
      });

      fetchPayments();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Submission failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "default" as const, label: "Pending" },
      verified: { variant: "secondary" as const, label: "Verified" },
      submitted_to_swift: { variant: "secondary" as const, label: "Submitted" },
    };

    const { variant, label } = config[status as keyof typeof config] || config.pending;

    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary">
              <ShieldCheck className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">SecurBank International</h1>
              <p className="text-sm text-muted-foreground">Employee Verification Portal</p>
            </div>
          </div>
          <Button onClick={signOut} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {employeeData && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Welcome, {employeeData.full_name}</CardTitle>
              <CardDescription>Employee ID: {employeeData.employee_number}</CardDescription>
            </CardHeader>
          </Card>
        )}

        <Alert>
          <ShieldCheck className="h-4 w-4" />
          <AlertDescription>
            Verify payment details carefully before approving. Check payee account information and SWIFT codes for accuracy.
          </AlertDescription>
        </Alert>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>International Payment Queue</CardTitle>
            <CardDescription>Review and verify customer payment requests</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Payee</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>SWIFT Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No payments to process
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{payment.customers?.full_name || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{payment.customers?.account_number || "N/A"}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{payment.payee_name}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {payment.payee_account_number}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {payment.currency} {payment.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono">{payment.swift_code}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {payment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => verifyPayment(payment.id)}
                              disabled={isLoading}
                            >
                              <CheckCircle2 className="mr-1 h-4 w-4" />
                              Verify
                            </Button>
                          )}
                          {payment.status === "verified" && (
                            <Button
                              size="sm"
                              onClick={() => submitToSwift(payment.id)}
                              disabled={isLoading}
                            >
                              Submit to SWIFT
                            </Button>
                          )}
                          {payment.status === "submitted_to_swift" && (
                            <Badge variant="secondary">Complete</Badge>
                          )}
                        </div>
                      </TableCell>
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

export default EmployeePortal;
