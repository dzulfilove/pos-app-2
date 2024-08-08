import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import "../../../styles/card.css";
import "../../../styles/button.css";
import { Paper, Button } from "@mui/material";
import { FaLuggageCart, FaRegSave } from "react-icons/fa";
import { IoAddCircleOutline } from "react-icons/io5";
import { PiShoppingCartBold } from "react-icons/pi";
import { RiDeleteBin5Line } from "react-icons/ri";
import { FaPeopleCarryBox } from "react-icons/fa6";
import { MdAddShoppingCart } from "react-icons/md";
import { FaRegAddressCard } from "react-icons/fa6";
import TableHistory from "../../../component/inventory/tableHistory";
import TableDetailHistory from "../../../component/inventory/tableDetailHistory";
import withRouter from "../../../component/features/withRouter";
import { collection, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../config/database";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import AOS from "aos";
import "aos/dist/aos.css";
function HistoryDetail({ params }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [indexDetail, setIndexDetail] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [totalStokMasuk, setTotalStokMasuk] = useState(0);
  const [totalStokKeluar, setTotalStokKeluar] = useState(0);
  const { id } = params;
  const idTanggal = params.id;
  const [dataHistory, setDataHistory] = useState([]);

  const formatLink = (str) => {
    return str.replace(/-/g, "/");
  };
  const formatTanggal = (value) => {
    const formattedDate = dayjs(value, "DD/MM/YYYY").format("D MMMM YYYY");
    return formattedDate;
  };
  useEffect(() => {
    getHistory();
  }, []);

  const getHistory = async () => {
    try {
      // Ambil data historyInventory berdasarkan dateInput yang sesuai
      const querySnapshot = await getDocs(
        query(
          collection(db, "historyInventory"),
          where("dateInput", "==", formatLink(idTanggal))
        )
      );

      // Ambil data dan fetch untuk setiap refItem
      const historyItems = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const itemRef = data.refItem;

          // Fetch data item berdasarkan refItem
          const itemDoc = await getDoc(itemRef);
          const itemData = itemDoc.data();

          return {
            id: doc.id,
            ...data,
            item: itemData,
            itemId: itemRef.id,
          };
        })
      );

      const stokMasuk = historyItems.filter((a) => a.status === "Stok Masuk");
      const stokKeluar = historyItems.filter((a) => a.status === "Stok Keluar");

      // Hitung total stokMasuk
      const totalStokMasuk = stokMasuk.reduce((total, item) => {
        return total + (item.stock || 0);
      }, 0);

      // Hitung total stokKeluar
      const totalStokKeluar = stokKeluar.reduce((total, item) => {
        return total + (item.stock || 0);
      }, 0);

      const totalStok = historyItems.reduce((total, item) => {
        return total + (item.stock || 0);
      }, 0);

      console.log(formatLink(idTanggal));
      console.log("Fetched History Inventory Items", historyItems);
      console.log("Total Stok Masuk:", totalStokMasuk);
      console.log("Total Stok Keluar:", totalStokKeluar);
      setTotalStok(totalStok);
      setTotalStokKeluar(totalStokKeluar);
      setTotalStokMasuk(totalStokMasuk);
      setDataHistory(historyItems); // Set data ke state atau lakukan tindakan lain sesuai kebutuhan
    } catch (e) {
      Swal.fire({
        title: "Error!",
        text: "Gagal mendapatkan data: " + e.message,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  console.log(dataDetail, "Detail data");
  return (
    <div>
      <div className="w-full h-full flex flex-col justify-start items-center pb-25">
        <div
          data-aos="slide-down"
          data-aos-delay="50"
          className="w-full flex justify-start items-center bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
        >
          <h3 className="text-white text-base font-normal">
            Detail Perubahan Stok
          </h3>
        </div>
        <div className="w-full flex justify-start gap-10 items-center mt-10 h-full">
          <div
            data-aos="fade-up"
            data-aos-delay="250"
            className="cookieCard w-[40%] p-6 shadow-md"
          >
            <div className="cookieDescription">
              <h3 className="text-xl font-medium">{totalStok} Stok</h3>
            </div>
            <h3 className="text-xs font-normal text-white w-full">
              Total Jumlah Stok
            </h3>
            <div className="z-[9999] absolute right-[5%] p-4 flex justify-center items-center bg-white rounded-full">
              <FaLuggageCart className="text-blue-600 text-[2rem]" />
            </div>
          </div>
          <div
            data-aos="fade-up"
            data-aos-delay="450"
            className="w-[30%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center"
          >
            <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-4  bg-white flex flex-col justify-between items-center">
              {" "}
              <div className="w-full flex justify-between items-center">
                <h3 className="text-sm font-normal">Total Stok Keluar</h3>
              </div>
              <div className="w-full flex justify-start gap-4 items-center">
                <h3 className="text-xl font-medium">{totalStokKeluar}</h3>
              </div>
            </div>
          </div>
          <div
            data-aos="fade-up"
            data-aos-delay="650"
            className="w-[30%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center"
          >
            <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-4  bg-white flex flex-col justify-between items-center">
              {" "}
              <div className="w-full flex justify-between items-center">
                <h3 className="text-sm font-normal">Total Stok Masuk</h3>
              </div>
              <div className="w-full flex justify-start gap-4 items-center">
                <h3 className="text-xl font-medium">{totalStokMasuk}</h3>
              </div>
            </div>
          </div>
        </div>
        <div
          data-aos="fade-up"
          data-aos-delay="750"
          className="bg-white shadow-md w-full p-6 rounded-xl flex justify-start items-center mt-5 "
        >
          <h3 className="text-base text-blue-600 font-medium">
            Riwayat Perubahan Stok, {formatTanggal(formatLink(idTanggal))}
          </h3>
        </div>
        <div
          data-aos="fade-up"
          className="w-full flex justify-center items-center h-full "
        >
          <TableDetailHistory data={dataHistory} />
        </div>
      </div>
    </div>
  );
}

export default withRouter(HistoryDetail);
