// 📄 src/app/register/page.tsx
import RegisterForm from "@/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white p-6 rounded-xl shadow-md">
        <RegisterForm />
      </div>
    </div>
  );
}