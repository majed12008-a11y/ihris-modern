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
import Facilities from "@/pages/Facilities";
import FacilityDetail from "@/pages/FacilityDetail";
import FacilityForm from "@/pages/FacilityForm";
import Salaries from "@/pages/Salaries";
import SalaryForm from "@/pages/SalaryForm";
import Training from "@/pages/Training";
import TrainingForm from "@/pages/TrainingForm";
import TrainingInstitutions from "@/pages/TrainingInstitutions";
import ScheduledCourseForm from "@/pages/ScheduledCourseForm";
import EnrolledStudents from "@/pages/EnrolledStudents";
import Users from "@/pages/Users";
import UserForm from "@/pages/UserForm";
import DeletedUsers from "@/pages/DeletedUsers";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import ReportForm from "@/pages/ReportForm";
import ReportExecute from "@/pages/ReportExecute";
import Countries from "@/pages/Countries";
import Jobs from "@/pages/Jobs";
import JobDetail from "@/pages/JobDetail";
import SalaryGrades from "@/pages/SalaryGrades";
import Cadres from "@/pages/Cadres";
import Classifications from "@/pages/Classifications";
import PositionTypes from "@/pages/PositionTypes";
import SalarySources from "@/pages/SalarySources";

function LoadingSpinner() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "var(--paper)",
      }}
    >
      <div className="state" role="status" aria-live="polite">
        <span className="spinner" aria-hidden="true" />
        <span className="state-text">جارٍ التحقق من الجلسة…</span>
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
          <Route path="facilities" element={<Facilities />} />
          <Route path="facilities/new" element={<FacilityForm />} />
          <Route path="facilities/:id" element={<FacilityDetail />} />
          <Route path="facilities/:id/edit" element={<FacilityForm />} />
          <Route path="salaries" element={<Salaries />} />
          <Route path="salaries/new" element={<SalaryForm />} />
          <Route path="salaries/:id/edit" element={<SalaryForm />} />
          <Route path="training" element={<Training />} />
          <Route path="training/new" element={<TrainingForm />} />
          <Route path="training/institutions" element={<TrainingInstitutions />} />
          <Route path="training/courses/:id/edit" element={<TrainingForm />} />
          <Route path="training/courses/:courseId/schedule/new" element={<ScheduledCourseForm />} />
          <Route path="training/scheduled/:scheduledId/edit" element={<ScheduledCourseForm />} />
          <Route path="training/scheduled/:id/enrollments" element={<EnrolledStudents />} />
          <Route path="users" element={<Users />} />
          <Route path="users/new" element={<UserForm />} />
          <Route path="users/deleted" element={<DeletedUsers />} />
          <Route path="users/:id/edit" element={<UserForm />} />
          <Route path="reports" element={<Reports />} />
          <Route path="reports/new" element={<ReportForm />} />
          <Route path="reports/:id" element={<ReportDetail />} />
          <Route path="reports/:id/edit" element={<ReportForm />} />
          <Route path="reports/:id/execute" element={<ReportExecute />} />
          <Route path="countries" element={<Countries />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="reference/salary-grades" element={<SalaryGrades />} />
          <Route path="reference/cadres" element={<Cadres />} />
          <Route path="reference/classifications" element={<Classifications />} />
          <Route path="reference/position-types" element={<PositionTypes />} />
          <Route path="reference/salary-sources" element={<SalarySources />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
