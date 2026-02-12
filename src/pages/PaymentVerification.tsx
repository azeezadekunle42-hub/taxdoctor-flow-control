import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaymentData {
  status: string;
  amount: number;
  reference: string;
  plan: string;
  tier: string;
  paid_at: string;
  customer_email: string;
}

const PaymentVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [payment, setPayment] = useState<PaymentData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const reference = searchParams.get("reference");
    if (!reference) {
      setError("No payment reference found.");
      setLoading(false);
      return;
    }

    const verifyPayment = async () => {
      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment?reference=${reference}`;
        const res = await fetch(url, {
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
        });
        const result = await res.json();

        if (result.error) {
          setError(result.error);
        } else {
          setPayment(result);
        }
      } catch {
        setError("Failed to verify payment. Please contact support.");
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-lg text-muted-foreground">Verifying your payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-6">
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold">Payment Verification Failed</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button variant="hero" className="rounded-full" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const isSuccess = payment?.status === "success";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="max-w-md text-center space-y-6">
        {isSuccess ? (
          <CheckCircle className="w-16 h-16 text-primary mx-auto" />
        ) : (
          <XCircle className="w-16 h-16 text-destructive mx-auto" />
        )}
        <h1 className="text-2xl font-bold">
          {isSuccess ? "Payment Successful!" : "Payment Not Completed"}
        </h1>
        <div className="bg-card rounded-2xl border border-border p-6 text-left space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Plan</span>
            <span className="font-semibold">{payment?.tier} — {payment?.plan}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Amount</span>
            <span className="font-semibold">₦{payment?.amount?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Reference</span>
            <span className="font-mono text-xs">{payment?.reference}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Email</span>
            <span>{payment?.customer_email}</span>
          </div>
        </div>
        <Button variant="hero" className="rounded-full" onClick={() => navigate("/")}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default PaymentVerification;
