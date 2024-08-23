import React from "react";
import "../../styles/card.css";
import "../../styles/button.css";
import { FaCartShopping } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { FaLuggageCart } from "react-icons/fa";
import { CgMonday } from "react-icons/cg";
import { ImStatsDots } from "react-icons/im";
import { BiCategory } from "react-icons/bi";
import { FaMoneyBillWave } from "react-icons/fa6";
import AOS from "aos";
import { GiProfit } from "react-icons/gi";
import "aos/dist/aos.css";
function MainReport() {
  return (
    <div>
      <div className="w-full h-full flex flex-col justify-start items-center pb-25">
        <div
          data-aos="slide-down"
          data-aos-delay="50"
          className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
        >
          <h3 className="text-white text-base font-normal"> Menu Laporan</h3>
        </div>
        <div className="w-full flex justify-center gap-10 items-center mt-10 h-full">
          <Link
            data-aos="fade-up"
            data-aos-delay="250"
            to="/today-report"
            className="btn-link w-[20rem] hover:text-slate-950"
          >
            <CgMonday className="text-[30px] text-blue-500" />

            <h3 className="text-sm font-medium text-blue-500 mt-2 hover:text-slate-950">
              Transaksi Hari Ini
            </h3>
          </Link>
          <Link
            data-aos="fade-up"
            data-aos-delay="350"
            to="/all-report"
            className="btn-link w-[20rem] hover:text-slate-950"
          >
            <ImStatsDots className="text-[30px] text-blue-500" />

            <h3 className="text-sm font-medium text-blue-500 mt-2 hover:text-slate-950">
              Laporan Semua Transaksi
            </h3>
          </Link>
        </div>
        <div className="w-full flex justify-center gap-10 items-center mt-10 h-full">
          <Link
            data-aos="fade-up"
            data-aos-delay="250"
            to="/today-report"
            className="btn-link w-[20rem] hover:text-slate-950"
          >
            <FaMoneyBillWave className="text-[30px] text-blue-500" />

            <h3 className="text-sm font-medium mt-2 text-blue-500  hover:text-slate-950">
              Transaksi E-Money
            </h3>
          </Link>
          <Link
            data-aos="fade-up"
            data-aos-delay="350"
            to="/transaction-other"
            className="btn-link w-[20rem] hover:text-slate-950"
          >
            <GiProfit className="text-[30px] text-blue-500" />

            <h3 className="text-sm font-medium mt2 text-blue-500 mt-2 hover:text-slate-950">
              Laporan Transaksi Lain-lain
            </h3>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MainReport;
