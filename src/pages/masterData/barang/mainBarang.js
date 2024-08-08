import React from "react";
import "../../../styles/card.css";
import "../../../styles/button.css";
import { FaCartShopping } from "react-icons/fa6";
import { Link } from "react-router-dom";
import { FaLuggageCart } from "react-icons/fa";
import { BiCategory } from "react-icons/bi";
import AOS from "aos";
import "aos/dist/aos.css";
function MainBarang() {
  return (
    <div>
      <div className="w-full h-full flex flex-col justify-start items-center pb-25">
        <div
          data-aos="slide-down"
          data-aos-delay="50"
          className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
        >
          <h3 className="text-white text-base font-normal"> Menu Barang</h3>
        </div>
        <div className="w-full flex justify-center gap-10 items-center mt-10 h-full">
          {/* <Link to="/master-barang" className="cookieCard w-[40%]">
            <div className="cookieDescription">
              <h3 className="text-xl font-medium">List Barang</h3>
            </div>
            <h3 className="text-xs font-normal text-white w-full">
              Master Data Item Barang
            </h3>
          </Link>
          
          */}

          <Link
            data-aos="fade-up"
            data-aos-delay="250"
            to="/master-barang"
            className="btn-link w-[20rem] hover:text-slate-950"
          >
            <FaLuggageCart className="text-[30px] text-blue-500" />

            <h3 className="text-sm font-medium text-blue-500 mt-1 hover:text-slate-950">
              Menu List Barang
            </h3>
          </Link>
          <Link
            data-aos="fade-up"
            data-aos-delay="450"
            to="/master-kategori"
            className="btn-link w-[20rem] hover:text-slate-950"
          >
            <BiCategory className="text-[30px] text-blue-500" />

            <h3 className="text-sm font-medium text-blue-500 mt-1 hover:text-slate-950">
              Menu List Kategori
            </h3>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MainBarang;
