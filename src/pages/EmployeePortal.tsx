import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ShieldCheck, LogOut, CheckCircle2, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { api } from "@/lib/api";

interface Transaction {
  _id: string;
  amount: number;
  currency: string;
  payeeAccountInfo: string;
  swiftCode: string;
  status: string;
  createdAt: string;
  customerId: {
    username: string;
    fullName: string;
    accountNumber: string;
  };
}

const EmployeePortal = () => {
  const { signOut, user } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactions, setSelectedTransactions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    try {
      const result = await api.getPendingTransactions();
      if (result.data) {
        setTransactions(result.data.transactions);
      } else if (result.error) {
        toast({
          variant: "destructive",
          title: "Error loading transactions",
          description: result.error,
        });
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  const verifyTransaction = async (transactionId: string) => {
    setIsLoading(true);
    try {
      const result = await api.verifyTransaction({ transactionId });
      if (result.error) throw new Error(result.error);

      toast({
        title: "Transaction verified",
        description: "The transaction has been marked as verified.",
      });

      fetchPendingTransactions();
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

  const submitToSwift = async () => {
    if (selectedTransactions.length === 0) {
      toast({
        variant: "destructive",
        title: "No transactions selected",
        description: "Please select verified transactions to submit to SWIFT.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await api.submitToSwift({ transactionIds: selectedTransactions });
      if (result.error) throw new Error(result.error);

      toast({
        title: "Submitted to SWIFT",
        description: `${result.data?.submittedCount || selectedTransactions.length} transactions submitted to SWIFT successfully.`,
      });

      setSelectedTransactions([]);
      fetchPendingTransactions();
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

  const handleSelectTransaction = (transactionId: string, checked: boolean) => {
    if (checked) {
      setSelectedTransactions([...selectedTransactions, transactionId]);
    } else {
      setSelectedTransactions(selectedTransactions.filter(id => id !== transactionId));
    }
  };

  const getStatusBadge = (status: string) => {
    const config = {
      pending: { variant: "default" as const, label: "Pending" },
      verified: { variant: "secondary" as const, label: "Verified" },
      submitted: { variant: "secondary" as const, label: "Submitted" },
      completed: { variant: "secondary" as const, label: "Completed" },
      failed: { variant: "destructive" as const, label: "Failed" },
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
        {user && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Welcome, {user.fullName}</CardTitle>
              <CardDescription>Employee Portal - Transaction Verification</CardDescription>
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
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>International Payment Queue</CardTitle>
                <CardDescription>Review and verify customer payment requests</CardDescription>
              </div>
              {selectedTransactions.length > 0 && (
                <Button onClick={submitToSwift} disabled={isLoading}>
                  <Send className="mr-2 h-4 w-4" />
                  Submit {selectedTransactions.length} to SWIFT
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Payee Account</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>SWIFT Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No transactions to process
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        {transaction.status === "verified" && (
                          <Checkbox
                            checked={selectedTransactions.includes(transaction._id)}
                            onCheckedChange={(checked) => 
                              handleSelectTransaction(transaction._id, checked as boolean)
                            }
                          />
                        )}
                      </TableCell>
                      <TableCell>{new Date(transaction.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>{transaction.customerId?.fullName || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.customerId?.accountNumber || "N/A"}</TableCell>
                      <TableCell className="font-mono text-sm">{transaction.payeeAccountInfo}</TableCell>
                      <TableCell className="font-semibold">
                        {transaction.currency} {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="font-mono">{transaction.swiftCode}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        {transaction.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => verifyTransaction(transaction._id)}
                            disabled={isLoading}
                          >
                            <CheckCircle2 className="mr-1 h-4 w-4" />
                            Verify
                          </Button>
                        )}
                        {transaction.status === "verified" && (
                          <Badge variant="secondary">Ready for SWIFT</Badge>
                        )}
                        {transaction.status === "submitted" && (
                          <Badge variant="secondary">Submitted to SWIFT</Badge>
                        )}
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
