import React from "react";
import { Button } from "./ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { FcGoogle } from "react-icons/fc";

interface GoogleLoginButtonProps {
  className?: string;
  size?: "default" | "sm" | "lg";
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ 
  className = "", 
  size = "default",
  variant = "outline" 
}) => {
  const { googleLogin } = useAuth();

  const handleGoogleLogin = () => {
    googleLogin();
  };

  return (
    <Button
      onClick={handleGoogleLogin}
      variant={variant}
      size={size}
      className={`w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 transition-colors ${className}`}
    >
      <FcGoogle className="w-5 h-5" />
      <span className="font-medium">Mit Google anmelden</span>
    </Button>
  );
};

export default GoogleLoginButton;