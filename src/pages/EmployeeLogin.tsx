import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { employeeLoginSchema, EmployeeLoginInput } from "@/lib/validations";

const EmployeeLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmployeeLoginInput>({
    resolver: zodResolver(employeeLoginSchema),
  });

  const onSubmit = async (data: EmployeeLoginInput) => {
    setIsLoading(true);
    
    try {
      const email = `${data.employeeNumber}@securbank.employee`;

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: data.password,
      });

      if (signInError) {
        throw new Error("Invalid credentials. Please check your employee number and password.");
      }

      // Verify employee exists
      const { data: employee, error: employeeError } = await supabase
        .from("employees")
        .select("employee_number")
        .eq("employee_number", data.employeeNumber)
        .maybeSingle();

      if (employeeError || !employee) {
        await supabase.auth.signOut();
        throw new Error("Employee number not found in our records.");
      }

      toast({
        title: "Welcome back!",
        description: "Login successful",
      });

      navigate("/employee/portal");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message || "An error occurred during login",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <div className="w-full max-w-md">
        <Link to="/" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Link>
        
        <Card className="shadow-lg border-primary/10">
          <CardHeader className="space-y-3">
            <div className="flex items-center justify-center mb-2">
              <div className="p-3 rounded-full bg-gradient-to-br from-primary to-primary/80">
                <ShieldCheck className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>
            <CardTitle className="text-2xl text-center">Employee Login</CardTitle>
            <CardDescription className="text-center">
              Access the payment verification portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="employeeNumber">Employee Number</Label>
                <Input
                  id="employeeNumber"
                  placeholder="EMP12345"
                  {...register("employeeNumber")}
                  disabled={isLoading}
                  className="uppercase"
                />
                {errors.employeeNumber && (
                  <p className="text-sm text-destructive">{errors.employeeNumber.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  {...register("password")}
                  disabled={isLoading}
                />
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password.message}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EmployeeLogin;
