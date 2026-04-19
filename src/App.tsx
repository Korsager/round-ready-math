import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Start from "./pages/Start.tsx";
import CoursePricing from "./pages/course/Pricing.tsx";
import CourseRevenue from "./pages/course/Revenue.tsx";
import CourseFundraising from "./pages/course/Fundraising.tsx";
import CourseCashflow from "./pages/course/Cashflow.tsx";
import CourseExport from "./pages/course/Export.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/start" replace />} />
          <Route path="/start" element={<Start />} />
          <Route path="/course/pricing" element={<CoursePricing />} />
          <Route path="/course/revenue" element={<CourseRevenue />} />
          <Route path="/course/fundraising" element={<CourseFundraising />} />
          <Route path="/course/cashflow" element={<CourseCashflow />} />
          <Route path="/course/export" element={<CourseExport />} />
          {/* Legacy routes redirect into the course */}
          <Route path="/dashboard" element={<Navigate to="/start" replace />} />
          <Route path="/assumptions" element={<Navigate to="/start" replace />} />
          <Route path="/forecast" element={<Navigate to="/course/revenue" replace />} />
          <Route path="/cashflow" element={<Navigate to="/course/cashflow" replace />} />
          <Route path="/pricing-playbook" element={<Navigate to="/course/pricing" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
