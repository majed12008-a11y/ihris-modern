import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import MainLayout from "@/components/layout/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Persons from "@/pages/Persons";
import PersonDetail from "@/pages/PersonDetail";
import PersonForm from "@/pages/PersonForm";
import Positions from "@/pages/Positions";
import PositionForm from "@/pages/PositionForm";
import Salaries from "@/pages/Salaries";
import SalaryForm from "@/pages/SalaryForm";
import Training from "@/pages/Training";
import TrainingForm from "@/pages/TrainingForm";
import Users from "@/pages/Users";
import UserForm from "@/pages/UserForm";

function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-600">جاري التحقق من الجلسة...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isHydrated } = useAuthStore();

  // انتظر حتى اكتمال تحميل الحالة من localStorage
  if (!isHydrated) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="persons" element={<Persons />} />
          <Route path="persons/new" element={<PersonForm />} />
          <Route path="persons/:id" element={<PersonDetail />} />
          <Route path="persons/:id/edit" element={<PersonForm />} />
          <Route path="positions" element={<Positions />} />
          <Route path="positions/new" element={<PositionForm />} />
          <Route path="positions/:id/edit" element={<PositionForm />} />
          <Route path="salaries" element={<Salaries />} />
          <Route path="salaries/new" element={<SalaryForm />} />
          <Route path="salaries/:id/edit" element={<SalaryForm />} />
          <Route path="training" element={<Training />} />
          <Route path="training/new" element={<TrainingForm />} />
          <Route path="users" element={<Users />} />
          <Route path="users/new" element={<UserForm />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
