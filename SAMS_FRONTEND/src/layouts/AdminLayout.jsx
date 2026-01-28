import { useState, useRef, useEffect } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { selectSidebarOpen } from "../features/ui/ui.selectors";
import { toggleSidebar } from "../features/ui/ui.slice";
import useAuth from "../hooks/useAuth";
import {
  HiOutlineViewGrid,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineCollection,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineChartBar,
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineAcademicCap,
  HiOutlineX,
  HiOutlineCog,
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineCalendar,
} from "react-icons/hi";

const AdminLayout = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarOpen = useSelector(selectSidebarOpen);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsRef = useRef(null);
  const { user, logout, isLoggingOut } = useAuth();

  // Close settings dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setSettingsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: HiOutlineViewGrid },
    { name: "Users", path: "/admin/users", icon: HiOutlineUsers },
    {
      name: "Departments",
      path: "/admin/departments",
      icon: HiOutlineOfficeBuilding,
    },
    { name: "Semesters", path: "/admin/semesters", icon: HiOutlineAcademicCap },
    { name: "Batches", path: "/admin/batches", icon: HiOutlineCalendar },
    { name: "Sections", path: "/admin/sections", icon: HiOutlineCollection },
    { name: "Subjects", path: "/admin/subjects", icon: HiOutlineBookOpen },
    {
      name: "Assignments",
      path: "/admin/teaching-assignments",
      icon: HiOutlineClipboardList,
    },
    { name: "Attendance", path: "/admin/attendance", icon: HiOutlineChartBar },
    { name: "Reports", path: "/admin/reports", icon: HiOutlineChartBar },
  ];

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div
      className="min-h-screen flex"
      style={{ backgroundColor: "var(--bg-main)" }}
    >
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Sidebar Drawer */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 md:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "var(--primary)" }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-white/10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "var(--primary-hover)" }}
              >
                <HiOutlineAcademicCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-base">Academia</h1>
                <p className="text-white/60 text-xs">Admin Portal</p>
              </div>
            </div>
            <button onClick={closeMobileMenu} className="text-white/70 p-1">
              <HiOutlineX className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={closeMobileMenu}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        active
                          ? "text-white bg-white/20"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span className="text-sm font-medium">{item.name}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User & Logout */}
          <div className="p-3 border-t border-white/10">
            <div className="px-3 py-2 mb-2">
              <p className="text-white text-sm font-medium truncate">
                {user?.fullname || "Admin"}
              </p>
              <p className="text-white/60 text-xs truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => {
                logout();
                closeMobileMenu();
              }}
              disabled={isLoggingOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} hidden md:flex transition-all duration-300 flex-col`}
        style={{ backgroundColor: "var(--primary)" }}
      >
        {/* Logo */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: "var(--primary-hover)" }}
            >
              <HiOutlineAcademicCap className="w-6 h-6 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-white font-semibold text-base">Academia</h1>
                <p className="text-white/60 text-xs">Admin Portal</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      active
                        ? "text-white"
                        : "text-white/70 hover:text-white hover:bg-white/10"
                    }`}
                    style={
                      active
                        ? {
                            backgroundColor: "var(--primary-hover)",
                            borderLeft: "4px solid #93C5FD",
                            marginLeft: "-4px",
                            paddingLeft: "calc(0.75rem + 4px)",
                          }
                        : {}
                    }
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="text-sm font-medium">{item.name}</span>
                    )}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User & Logout */}
        <div className="p-3 border-t border-white/10">
          {sidebarOpen && (
            <div className="px-3 py-2 mb-2">
              <p className="text-white text-sm font-medium truncate">
                {user?.fullname || "Admin"}
              </p>
              <p className="text-white/60 text-xs truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={logout}
            disabled={isLoggingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50"
          >
            <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && (
              <span className="text-sm font-medium">
                {isLoggingOut ? "Logging out..." : "Logout"}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header
          className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 shadow-sm"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 md:hidden"
              style={{ color: "var(--text-secondary)" }}
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            {/* Desktop sidebar toggle */}
            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-2 rounded-lg transition-colors hover:bg-gray-100 hidden md:flex"
              style={{ color: "var(--text-secondary)" }}
            >
              <HiOutlineMenu className="w-5 h-5" />
            </button>
            <div className="md:hidden">
              <span
                className="font-semibold text-sm"
                style={{ color: "var(--primary)" }}
              >
                Academia
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span
              style={{ color: "var(--text-secondary)" }}
              className="text-xs md:text-sm hidden sm:inline"
            >
              Welcome,{" "}
              <span
                className="font-medium"
                style={{ color: "var(--text-primary)" }}
              >
                {user?.fullname || "Admin"}
              </span>
            </span>
            <span
              className="px-2 md:px-3 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: "var(--primary-light)",
                color: "var(--primary)",
              }}
            >
              ADMIN
            </span>
            {/* Settings Dropdown */}
            <div className="relative" ref={settingsRef}>
              <button
                onClick={() => setSettingsOpen(!settingsOpen)}
                className="p-2 rounded-lg transition-colors hover:bg-gray-100"
                style={{ color: "var(--text-secondary)" }}
              >
                <HiOutlineCog className="w-5 h-5" />
              </button>
              {settingsOpen && (
                <div
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg py-1 z-50"
                  style={{
                    backgroundColor: "var(--bg-card)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <button
                    onClick={() => {
                      navigate("/admin/profile");
                      setSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <HiOutlineUser className="w-4 h-4" />
                    My Profile
                  </button>
                  <button
                    onClick={() => {
                      navigate("/admin/change-password");
                      setSettingsOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <HiOutlineKey className="w-4 h-4" />
                    Change Password
                  </button>
                  <div
                    className="my-1"
                    style={{ borderTop: "1px solid var(--border)" }}
                  />
                  <button
                    onClick={() => {
                      logout();
                      setSettingsOpen(false);
                    }}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                    style={{ color: "var(--danger)" }}
                  >
                    <HiOutlineLogout className="w-4 h-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="max-w-[1400px] mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
