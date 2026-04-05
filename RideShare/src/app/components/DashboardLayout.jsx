import { Outlet } from "react-router";
import Sidebar from "./Sidebar";

const DashboardLayout = () => {
  return (
    <div className="page-shell flex h-screen bg-gradient-to-br from-gray-50 via-white to-green-50">
      <Sidebar />
      <main className="page-content flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;
