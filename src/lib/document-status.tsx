import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";

export const getDocumentStatus = (expiryDate: string) => {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const diffTime = expiry.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: 'Vencido',
      icon: <XCircle className="h-5 w-5 text-red-500" />,
      color: 'text-red-600',
    };
  }
  if (diffDays <= 30) {
    return {
      label: 'Por Vencer',
      icon: <AlertTriangle className="h-5 w-5 text-yellow-500" />,
      color: 'text-yellow-600',
    };
  }
  return {
    label: 'Vigente',
    icon: <CheckCircle className="h-5 w-5 text-green-500" />,
    color: 'text-green-600',
  };
};
