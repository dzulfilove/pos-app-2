import React, { useEffect, useState } from "react";
import TableData from "../../component/transaction/table";
import MUIDataTable from "mui-datatables";
import "../../styles/card.css";
import { Paper, TablePagination, Button } from "@mui/material";
import { FaLuggageCart } from "react-icons/fa";
import { IoAddCircleOutline } from "react-icons/io5";
import { GiReceiveMoney } from "react-icons/gi";
import DropdownSearch from "../../component/features/dropdown";
import { FaRegSave } from "react-icons/fa";
import { FaArrowTrendUp } from "react-icons/fa6";
import {
  addDoc,
  and,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../config/database";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { DatePicker, Space } from "antd";
import { MdDelete } from "react-icons/md";
import { IoEyeSharp } from "react-icons/io5";
import { TabBar } from "../../component/features/tabBar";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../component/features/loader";
import LoaderTable from "../../component/features/loader2";

function HistoryStok() {
  const [isCek, setIsCek] = useState(false);
  const [dataDetail, setDataDetail] = useState({});

  const [nominalTransaksi, setNominalTransaksi] = useState(0);
  const [selisih, setSelisih] = useState("");

  const [dataHistory, setDataHistory] = useState([]);

  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [totalNominal, setTotalNominal] = useState(0);
  const [totalSelisih, setTotalSelisih] = useState(0);
  const [totalKurang, setTotalKurang] = useState(0);
  const [totalLebih, setTotalLebih] = useState(0);
  const cabang = sessionStorage.getItem("cabang");

  const nama = sessionStorage.getItem("nama");
  const [isData, setIsData] = useState(true);
  const [isLoad, setIsLoad] = useState(false);

  useEffect(() => {}, []);

  const getHistory = async (tgl) => {
    try {
      // Menggunakan `&&` untuk menggabungkan kondisi di `where`
      const historyQuery = query(
        collection(db, `historyCheck${cabang}`),
        where("dateCheck", "==", tgl),
        where("type", "==", "Stock")
      );

      // Mendapatkan dokumen dari query
      const querySnapshot = await getDocs(historyQuery);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Menghitung total gap dari semua transaksi
      const total = items.reduce(
        (acc, transaction) => acc + transaction.totalGap,
        0
      );

      // Menghitung total gap untuk transaksi dengan info "Kurang"
      const totalKurang = items
        .filter((transaction) => transaction.info === "Kurang")
        .reduce((acc, transaction) => acc + transaction.totalGap, 0);

      // Menghitung total gap untuk transaksi dengan info selain "Kurang"
      const totalLebih = items
        .filter((transaction) => transaction.info !== "Kurang")
        .reduce((acc, transaction) => acc + transaction.totalGap, 0);

      // Mengatur state dengan hasil perhitungan
      setTotalKurang(totalKurang);
      setTotalLebih(totalLebih);
      setTotalSelisih(total);
      setDataHistory(items);
      setIsData(false);

      console.log(tgl);
      console.log(items);
    } catch (e) {
      Swal.fire({
        title: "Error!",
        text: "Gagal mendapatkan data: " + e.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      return null;
    }
  };

  const handleCekRiwayat = () => {
    getHistory(tanggal);
    setIsCek(true);
  };
  function formatRupiah(number) {
    // Mengonversi angka menjadi string dan membalik urutannya
    let numberString = number.toString().split("").reverse().join("");

    // Menambahkan titik setiap 3 digit
    let rupiah = "";
    for (let i = 0; i < numberString.length; i++) {
      if (i > 0 && i % 3 === 0) {
        rupiah += ".";
      }
      rupiah += numberString[i];
    }

    // Membalik urutan kembali dan menambahkan prefix "Rp"
    return "Rp " + rupiah.split("").reverse().join("");
  }

  const columnsAll = [
    {
      name: "time",
      label: "Pukul",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "totalTrans",
      label: "Transaksi",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "realCash",
      label: "Cash Fisik",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const price = value;
          return price;
        },
      },
    },
    {
      name: "sysCash",
      label: "Cash System",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const price = value;
          return price;
        },
      },
    },
    {
      name: "gap",
      label: "Selisih Cash",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const price = value;
          return price;
        },
      },
    },
    {
      name: "info",
      label: "Status",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              {value !== "Kurang" ? (
                <>
                  <div className="flex p-2 rounded-md justify-center items-center bg-teal-100 text-teal-700 capitalize">
                    Lebih
                  </div>
                </>
              ) : (
                <>
                  <div className="flex p-2 rounded-md justify-center items-center bg-yellow-100 text-yellow-700">
                    Kurang
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    },
  ];

  const dataAll = dataHistory.map((a) => {
    return {
      time: a.timeCheck,
      totalTrans: a.totalTransaction,
      realCash: a.totalActuallyStock,
      sysCash: a.totalSystemStock,
      gap: a.totalGap,
      info: a.info,
      data: a,
    };
  });

  console.log(dataDetail, "Detail data");
  return (
    <div>
      {" "}
      <div>
        {isLoad ? (
          <>
            <div className="w-full h-[100vh] flex flex-col justify-center items-center">
              <Loader />
              <h3 className="text-base text-blue-600 mt-5">
                Tunggu Bentar Yaa..
              </h3>
            </div>
          </>
        ) : (
          <>
            <div className="w-full h-full flex flex-col justify-start items-center pb-25">
              <div
                data-aos="slide-down"
                data-aos-delay="50"
                className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
              >
                <h3 className="text-white text-base font-normal">
                  Riwayat Check Jumlah Stok
                </h3>
              </div>
              <div className="w-full flex justify-start gap-10 items-center mt-10 h-full">
                <div
                  data-aos="fade-up"
                  data-aos-delay="250"
                  className="cookieCard w-[50%]"
                >
                  <div className="cookieDescription">
                    <h3 className="text-xl font-medium">
                      {dataHistory.length} Check
                    </h3>
                  </div>
                  <h3 className="text-xs font-normal text-white w-full">
                    Total Jumlah Check
                  </h3>
                  <div className="z-[9999] absolute right-[5%] p-4 flex justify-center items-center bg-white  rounded-full">
                    <FaLuggageCart className="text-blue-700 text-[2rem]" />
                  </div>
                </div>
                <div
                  data-aos="fade-up"
                  data-aos-delay="350"
                  className="w-[50%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
                >
                  <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
                    <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xl font-medium">{totalSelisih}</h3>
                      </div>
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xs font-normal">
                          Total Nominal Selisih
                        </h3>
                      </div>
                    </div>
                    <div className="w-[80%] flex flex-col justify-center gap-4 items-end">
                      <div className=" w-[4rem] h-[4rem] bg-blue-100 rounded-full flex justify-center items-center p-3">
                        <GiReceiveMoney className="text-blue-600 text-[2.2rem]" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full flex justify-between items-center  p-2 rounded-md mt-5 gap-4 mb-5">
                <div
                  data-aos="fade-up"
                  data-aos-delay="450"
                  className="w-[47%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
                >
                  <div className="w-full flex justify-between items-start ">
                    <h3 className="text-base font-medium">Selisih Lebih</h3>
                    <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                      <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between items-start gap-1">
                    <h3 className="text-xl font-medium">{totalLebih}</h3>
                    <h3 className="text-xs font-medium">Total Selisih Lebih</h3>
                  </div>
                </div>

                <div
                  data-aos="fade-up"
                  data-aos-delay="550"
                  className="w-[47%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
                >
                  <div className="w-full flex justify-between items-start ">
                    <h3 className="text-base font-medium">Selisih Kurang</h3>
                    <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                      <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between items-start gap-1">
                    <h3 className="text-xl font-medium">{totalKurang}</h3>

                    <h3 className="text-xs font-medium">
                      Total Selisih Kurang
                    </h3>
                  </div>
                </div>
              </div>

              <div
                data-aos="fade-up"
                className="w-full bg-white rounded-xl flex flex-col p-4 justify-start items-center shadow-md my-5"
              >
                <div className="w-full bg-white flex  justify-start items-center ">
                  <div className=" flex justify-start gap-6 items-center">
                    <p className="text-sm font-normal"> Pilih Tanggal</p>
                    <Space direction="vertical" size={12}>
                      <DatePicker
                        defaultValue={dayjs(tanggal, "DD/MM/YYYY")}
                        format={["DD/MM/YYYY"]}
                        onChange={(date) => {
                          setTanggal(date.format("DD/MM/YYYY"));
                        }}
                        className="w-[12rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </Space>
                  </div>
                  <div className="flex justify-start items-center  ml-4 ">
                    <button
                      type="button"
                      className="bg-blue-500 text-center mb-2 w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      onClick={handleCekRiwayat}
                    >
                      <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                        <FaRegSave className="text-[20px] text-blue-700 hover:text-blue-700" />
                      </div>
                      <p className="translate-x-2 text-xs text-white">
                        Cek Riwayat
                      </p>
                    </button>
                  </div>
                </div>
              </div>
              {isCek && (
                <>
                  <div
                    // data-aos="fade-up"
                    className="w-full flex justify-center  items-center mt-5 h-full mb-28"
                  >
                    {isData ? (
                      <>
                        <LoaderTable />
                      </>
                    ) : (
                      <>
                        <Paper style={{ height: 400, width: "100%" }}>
                          <MUIDataTable
                            columns={columnsAll}
                            data={dataAll}
                            options={{
                              fontSize: 12, // adjust font size here
                            }}
                            pagination
                            rowsPerPageOptions={[
                              10,
                              50,
                              { value: -1, label: "All" },
                            ]}
                          />
                        </Paper>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HistoryStok;
