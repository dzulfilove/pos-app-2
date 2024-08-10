import "./App.css";
import "../src/styles/button.css";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Link,
  Navigate,
} from "react-router-dom";
import "primereact/resources/themes/saga-blue/theme.css"; // Ganti tema sesuai kebutuhan Anda
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import { FaJediOrder } from "react-icons/fa";
import React, { useEffect, useState } from "react";
import { HiMenuAlt3 } from "react-icons/hi";
import { MdOutlineDashboard } from "react-icons/md";
import { BsPersonWorkspace } from "react-icons/bs";
import { CgDatabase } from "react-icons/cg";
import { FaRegUser } from "react-icons/fa";
import { MdOutlineInventory2 } from "react-icons/md";
import { PiShoppingCartBold } from "react-icons/pi";
import AOS from "aos";
import "aos/dist/aos.css";
import "dayjs/locale/id";
import { IoStatsChartSharp } from "react-icons/io5";
import { IoMdExit } from "react-icons/io";

import { BsPersonLinesFill } from "react-icons/bs";
import Dashboard from "./pages/dashboard/dashboard";
import MainBarang from "./pages/masterData/barang/mainBarang";
import MasterBarang from "./pages/masterData/barang/masterBarang";
import MasterKategori from "./pages/masterData/barang/masterKategori";
import MasterInventory from "./pages/masterData/inventory/masterInventory";
import InventoryDetail from "./pages/masterData/inventory/InventoryDetail";
import HistoryDetail from "./pages/masterData/inventory/historyDetail";
import MainTransaction from "./pages/transaction/mainTransaction";
import MainReport from "./pages/report/mainReport";
import TodayReport from "./pages/report/mainTodayReport";
import PeriodeReport from "./pages/report/mainPeriodeReport";
import Auth from "./pages/auth/auth";

const App = () => {
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");
  const isLamaran = sessionStorage.getItem("isLamaran");
  // const isLoggedIn = true;
  const menus = [
    { name: "Dashboard", link: "", icon: MdOutlineDashboard, main: false },
    { name: "Transaksi", link: "transaction", icon: FaJediOrder, main: false },
    { name: "Barang", link: "barang", icon: PiShoppingCartBold, main: false },
    {
      name: "Inventory",
      link: "inventory",
      icon: MdOutlineInventory2,
      main: false,
    },

    {
      name: "Laporan",
      link: "report",
      icon: IoStatsChartSharp,
      main: false,
    },
    { name: "Karyawan", link: "employee", icon: BsPersonWorkspace, main: true },
    {
      name: "Master Data",
      link: "masterData",
      icon: CgDatabase,
      main: true,
    },
  ];

  const [open, setOpen] = useState(true);
  const [openKaryawan, setOpenKaryawan] = useState(true);
  const [openMasterData, setOpenMasterData] = useState(true);
  const [menu, setMenu] = useState("dashboard");
  const [isSubMenu, setIsSubMenu] = useState(false);
  const [isSubMenuKaryawan, setIsSubMenuKaryawan] = useState(false);
  const [isSubMenuMasterData, setIsSubMenuMasterData] = useState(false);

  useEffect(() => {
    AOS.init({ duration: 700 });
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("isLoggedIn");
    sessionStorage.removeItem("userID");
    sessionStorage.removeItem("userEmail");
    window.location.href = "/";
  };

  return (
    <>
      {isLoggedIn ? (
        <>
          <Router>
            <section
              className={` flex w-full gap-6 bg-slate-100 h-full p-0 mb-16`}
            >
              <div
                className={`bg-blue-700 min-h-screen pl-8 z-[999] ${
                  open ? "w-[12rem]" : "w-[6rem]"
                } duration-500 text-gray-100 px-4 text-sm border-r-2 border-r-blue-100 rounded-tr-xl rounded-br-xl shadow-blue-600 shadow-xl`}
              >
                <div className="flex justify-between items-center mt-12 w-full border-b border-b-slate-600 pb-12">
                  <div
                    className={`flex ${
                      open ? "px-4" : "px-0"
                    }items-center justify-center gap-2 py-5.5 lg:py-6.5  w-full `}
                  >
                    <div
                      className="flex px-1 justify-center gap-5 w-full items-center text-blue-100  "
                      onClick={() => {
                        window.location.href = "/";
                      }}
                    >
                      {/* <FaRegUser /> */}
                      {open && (
                        <>
                          <h5
                            style={{
                              transitionDelay: `${4}00ms`,
                            }}
                            className={`text-base font-semibold text-blue-100 text-center whitespace-pre duration-500 ${
                              !open &&
                              "opacity-0 translate-x-28 overflow-hidden"
                            }`}
                          >
                            APIN CELL
                          </h5>
                        </>
                      )}
                    </div>
                  </div>
                  <div className=" flex justify-end items-center ">
                    <HiMenuAlt3
                      size={26}
                      className="cursor-pointer"
                      onClick={() => setOpen(!open)}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2 relative text-blue-100 ">
                  {/* {isLoggedIn ? (
                <> */}
                  {menus.map((menu) => (
                    <div
                      className={`flex flex-col justify-start  gap-3 items-center ${
                        open ? "overflow-y-hidden" : ""
                      }`}
                    >
                      {menu.main == false ? (
                        <>
                          <Link
                            to={`/${menu.link}`}
                            className={` ${
                              menu?.margin && "mt-5"
                            } z-[9] group flex ${
                              open == true
                                ? "justify-start w-[8.3rem] px-4 gap-3.5"
                                : " p-2 justify-center w-[4rem]"
                            } items-center  text-lg button  font-medium rounded-md  transition duration-300 ease-in-out`}
                          >
                            <div className="button-content">
                              {React.createElement(menu.icon, {
                                size: "20",
                              })}
                            </div>
                            <h2
                              style={{
                                transitionDelay: `${1 + 3}00ms`,
                              }}
                              className={`whitespace-pre duration-500 button-content text-sm ${
                                !open && "opacity-0 hidden translate-x-28  "
                              }`}
                            >
                              {menu.name}
                            </h2>
                            <h2
                              className={`${
                                open && "hidden"
                              } absolute z-[99999] text-sm left-48 bg-slate-300 font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg px-0 py-0 w-0 overflow-hidden group-hover:px-2 group-hover:py-1 group-hover:left-14 group-hover:duration-300 group-hover:w-fit  `}
                            >
                              {menu.name}
                            </h2>
                          </Link>
                        </>
                      ) : (
                        <>
                          {menu.name == "Kandidat" && (
                            <>
                              <button
                                onClick={() => setIsSubMenu(!isSubMenu)}
                                className={` ${
                                  menu?.margin && "mt-5"
                                } z-[9] group flex ${
                                  open == true
                                    ? "justify-start w-[10rem] px-4 gap-3.5"
                                    : " p-2 justify-center w-[4rem]"
                                } items-center  text-lg button  font-medium rounded-md  transition duration-300 ease-in-out`}
                              >
                                <div className="button-content">
                                  {React.createElement(menu.icon, {
                                    size: "20",
                                  })}
                                </div>
                                <h2
                                  style={{
                                    transitionDelay: `${1 + 3}00ms`,
                                  }}
                                  className={`whitespace-pre duration-500 button-content text-sm ${
                                    !open && "opacity-0 hidden translate-x-28  "
                                  }`}
                                >
                                  {menu.name}
                                </h2>
                                <h2
                                  className={`${
                                    open && "hidden"
                                  } absolute z-[99999] left-48 text-sm bg-slate-300 font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg px-0 py-0 w-0 overflow-hidden group-hover:px-2 group-hover:py-1 group-hover:left-14 group-hover:duration-300 group-hover:w-fit  `}
                                >
                                  {menu.name}
                                </h2>
                              </button>
                            </>
                          )}
                        </>
                      )}

                      {isSubMenu && menu.name == "Kandidat" && open && (
                        <div
                          data-aos="slide-down"
                          className=" top-full left-0 w-48  shadow-md py-2  rounded text-sm overlow-hidden text-sm"
                          onAnimationEnd={() => setIsSubMenu(false)}
                        >
                          <ul>
                            <li className="  py-2 button  text-slate-300 flex items-center justify-start pl-10 ">
                              <Link
                                to="/all-candidate"
                                className=" button-content  text-slate-300 text-sm"
                              >
                                Semua Kandidat
                              </Link>
                            </li>
                            <li className=" mt-4  py-2 button  text-slate-300 flex items-center justify-start pl-10">
                              <Link
                                to="/manage-candidate"
                                className=" button-content text-slate-300 "
                              >
                                Kelola kandidat
                              </Link>
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                  <div
                    className={`flex flex-col justify-start  gap-3 items-center  ${
                      open ? "overflow-y-hidden" : ""
                    }`}
                  >
                    <button
                      onClick={handleLogout}
                      className={` ${menu?.margin && ""} z-[9] group flex ${
                        open == true
                          ? "justify-start w-[8rem] px-4 gap-3.5"
                          : " p-2 justify-center w-[4rem]"
                      } items-center  text-lg button  font-medium rounded-md  transition duration-300 ease-in-out`}
                    >
                      <div className="button-content">
                        <div>
                          {React.createElement(IoMdExit, { size: "20" })}
                        </div>
                      </div>
                      <h2
                        style={{
                          transitionDelay: `${1 + 3}00ms`,
                        }}
                        className={`whitespace-pre duration-500 button-content text-sm ${
                          !open && "opacity-0 hidden translate-x-28  "
                        }`}
                      >
                        Logout
                      </h2>
                      <h2
                        className={`${
                          open && "hidden"
                        } absolute z-[99999] left-48 text-sm bg-slate-300 font-semibold whitespace-pre text-gray-900 rounded-md drop-shadow-lg px-0 py-0 w-0 overflow-hidden group-hover:px-2 group-hover:py-1 group-hover:left-14 group-hover:duration-300 group-hover:w-fit  `}
                      >
                        Logout
                      </h2>
                    </button>
                  </div>
                </div>
              </div>
              <div className=" mt-8 text-gray-900 font-semibold w-full flex flex-col justify-start items-center bg-blue-50 px-6 overflow-y-scroll mb-36">
                <div className="h-[100vh] w-[100%]  p-0 pb-12 m-0">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/barang" element={<MainBarang />} />
                    <Route path="/report" element={<MainReport />} />
                    <Route path="/transaction" element={<MainTransaction />} />
                    <Route path="/today-report" element={<TodayReport />} />
                    <Route path="/all-report" element={<PeriodeReport />} />
                    <Route path="/inventory" element={<MasterInventory />} />
                    <Route
                      path="/inventory-detail/:id"
                      element={<InventoryDetail />}
                    />
                    <Route
                      path="/history-detail/:id"
                      element={<HistoryDetail />}
                    />
                    <Route path="/master-barang" element={<MasterBarang />} />
                    <Route
                      path="/master-kategori"
                      element={<MasterKategori />}
                    />
                  </Routes>
                  <div className="w-full flex justify-center  items-center mt-5 h-[30rem] mb-12"></div>
                </div>
              </div>
            </section>
          </Router>
        </>
      ) : (
        <>
          <div>
            <Router>
              <Routes>
                <Route path="/" element={<Auth />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </div>
        </>
      )}
    </>
  );
};

export default App;
