import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Forecast from "./pages/Forecast.tsx";
import Cashflow from "./pages/Cashflow.tsx";
import PricingPlaybook from "./pages/PricingPlaybook.tsx";
import Assumptions from "./pages/Assumptions.tsx";
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
          <Route path="/dashboard" element={<Index />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/cashflow" element={<Cashflow />} />
          <Route path="/pricing-playbook" element={<PricingPlaybook />} />
          <Route path="/assumptions" element={<Assumptions />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
