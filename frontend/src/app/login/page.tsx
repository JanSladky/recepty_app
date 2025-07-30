// 📁 src/app/login/page.tsx
"use client";

import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full p-6 bg-white rounded shadow">
        <LoginForm />
      </div>
    </main>
  );
}