import React, { useEffect, useRef, useState } from "react";
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
import { IoSearch } from "react-icons/io5";
import { RiPencilFill } from "react-icons/ri";
import { FaCheck } from "react-icons/fa6";
import {
  addDoc,
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
import { MdDelete } from "react-icons/md";
import { IoEyeSharp } from "react-icons/io5";
import { TabBar } from "../../component/features/tabBar";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../component/features/loader";
import LoaderTable from "../../component/features/loader2";
import "dayjs/locale/id";

import { DatePicker, Space } from "antd";
const dateFormatList = ["DD/MM/YYYY", "DD/MM/YY", "DD-MM-YYYY", "DD-MM-YY"];

function OtherIncomeReport() {
  const [isCek, setIsCek] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const cabang = sessionStorage.getItem("cabang");

  const [nominalTransaksi, setNominalTransaksi] = useState(0);
  const [selisih, setSelisih] = useState("");
  const [jenisPembayaran, setJenisPembayaran] = useState(null);
  const [indexDetail, setIndexDetail] = useState(0);
  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const [dataTransaction, setDataTransaction] = useState([]);
  const [transUncheck, setTransUncheck] = useState([]);
  const [dataPiutang, setDataPiutang] = useState([]);
  const [dataOther, setDataOther] = useState([]);
  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [tanggalAwal, setTanggalAwal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [tanggalAkhir, setTanggalAkhir] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );

  const [totalNominal, setTotalNominal] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalNominalPiutang, setTotalNominalPiutang] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);
  const [totalNominalLain, setTotalNominalLain] = useState(0);
  const [itemTerlaris, setitemTerlaris] = useState({});
  const [activeTabIndex, setActiveTabIndex] = useState("tab1");
  const [selectedItems, setSelectedItems] = useState([]);
  const nama = sessionStorage.getItem("nama");
  const [isData, setIsData] = useState(true);
  const [isLoad, setIsLoad] = useState(false);
  const targetRef = useRef(null);
  useEffect(() => {
    getTransactions(bulan, tahun);
    scrollToTarget();
  }, []);

  const scrollToTarget = () => {
    targetRef.current.scrollIntoView({ behavior: "smooth" });
  };
  const getTransactions = async (month, year) => {
    try {
      // Buat query dengan filter where
      const transactionsQuery = query(
        collection(db, `transactions${cabang}`),
        where("month", "==", month), // Ganti kondisi where untuk bulan
        where("year", "==", year) // Ganti kondisi where untuk tahun
      );

      const querySnapshot = await getDocs(transactionsQuery);
      // Jika tidak ada dokumen yang ditemukan, kembalikan array kosong
      if (querySnapshot.empty) {
        console.log("No transactions found for the given month and year.");
        setTransUncheck([]);
        setTotalQris(0);
        setTotalTransfer(0);
        setDataPiutang([]);
        setDataOther([]);
        setitemTerlaris({});
        setDataTransaction([]);
        setTotalNominal(0);
        setTotalNominalPiutang(0);
        setTotalNominalLain(0);
        setIsData(false);
        return [];
      }
      const transactions = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Fetch data item berdasarkan refItem
          const itemRef = data.refItem;
          const itemDoc = await getDoc(itemRef);
          const itemData = itemDoc.data();

          // Fetch data category berdasarkan refCategory
          const categoryRef = data.refCategory;
          const categoryDoc = await getDoc(categoryRef);
          const categoryData = categoryDoc.data();

          // Menghitung total harga dari price * quantity
          const total = data.price * data.quantity;
          let profit = 0;

          if (
            itemRef.id == "GBwAvYWhBOpnvkUBDCV6" ||
            itemRef.id == "zYIsvQcu1HFFYBsfnCF7"
          ) {
            profit = total;
          } else {
            profit = total - data.quantity * itemData.buyPrice;
          }

          return {
            id: doc.id,
            ...data,
            item: itemData,
            category: categoryData,
            itemId: itemRef.id,
            profit: profit,
            categoryId: categoryRef.id,
            total: total, // Tambahkan properti total
          };
        })
      );

      const otherData = transactions.filter(
        (a) =>
          a.itemId == "GBwAvYWhBOpnvkUBDCV6" ||
          a.itemId == "zYIsvQcu1HFFYBsfnCF7"
      );
      if (otherData.length > 0) {
        // Menghitung total dari semua transaksi
        const totalNominal = otherData
          .filter((a) => a.itemId != "GBwAvYWhBOpnvkUBDCV6")
          .reduce((acc, transaction) => acc + transaction.total, 0);

        const totalPiutang = otherData
          .filter((a) => a.itemId == "GBwAvYWhBOpnvkUBDCV6")
          .reduce((acc, transaction) => acc + transaction.total, 0);

        // Menghitung total untuk payment "Tunai"
        const totalNominalLain = otherData
          .filter((transaction) => transaction.itemId != "GBwAvYWhBOpnvkUBDCV6")
          .reduce((acc, transaction) => acc + transaction.total, 0);

        console.log(`transactions${cabang}`, otherData);
        console.log("Total Nominal", totalNominal);

        // Kelompokkan data berdasarkan refItem
        const groupedByItem = otherData.reduce((acc, transaction) => {
          const itemId = transaction.itemId;
          if (!acc[itemId]) {
            acc[itemId] = {
              itemId: itemId,
              itemName: transaction.item.itemName, // Tambahkan nama item
              unit: transaction.item.unit, // Tambahkan nama item
              jumlahTransaksi: 0,
              totalBarang: 0, // Inisialisasi totalBarang
              dataTransaksi: [],
            };
          }
          acc[itemId].jumlahTransaksi += 1; // Tambahkan jumlah transaksi
          acc[itemId].totalBarang += transaction.quantity; // Tambahkan quantity ke totalBarang
          acc[itemId].dataTransaksi.push(transaction); // Tambahkan transaksi ke kelompok
          return acc;
        }, {});

        // Temukan item dengan jumlah transaksi terbanyak
        const mostFrequentItem = Object.values(groupedByItem).reduce(
          (prev, current) => {
            return current.jumlahTransaksi > prev.jumlahTransaksi
              ? current
              : prev;
          }
        );

        const transactionPiutang = otherData.filter(
          (a) => a.itemId == "GBwAvYWhBOpnvkUBDCV6"
        );
        const transactionOther = otherData.filter(
          (a) => a.itemId != "GBwAvYWhBOpnvkUBDCV6"
        );
        const transactionUnCheck = otherData.filter(
          (a) => a.isCheck == false || !a.isCheck
        );

        console.log("Most Frequent Item:", mostFrequentItem);
        setTransUncheck(transactionUnCheck);
        setTotalQris(totalQris);

        setDataPiutang(transactionPiutang);
        setIsData(false);
        setDataOther(transactionOther);
        setitemTerlaris(mostFrequentItem);
        setDataTransaction(otherData); // Simpan transaksi ke state
        setTotalNominal(totalNominal); // Simpan total nominal ke state
        setTotalNominalPiutang(totalPiutang); // Simpan total nominal tunai ke state
        setTotalNominalLain(totalNominalLain); // Simpan total nominal non-tunai ke state}
      } else {
        setIsData(false);
      }
    } catch (e) {
      Swal.fire({
        title: "Error!",
        text: "Gagal mendapatkan data: " + e.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      return [];
    }
  };
  const getInventory = async (itemRef) => {
    try {
      const inventoryQuery = query(
        collection(db, `inventorys${cabang}`),
        where("refItem", "==", itemRef)
      );

      const querySnapshot = await getDocs(inventoryQuery);
      const items = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return items[0];
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

  const handleDetailData = (data) => {
    if (indexDetail === data.id && isDetail) {
      setIsDetail(false);
    } else {
      setIsDetail(true);
    }

    setIndexDetail(data.id);
    setIsOpen(false);
    setDataDetail(data);
  };
  const handleDelete = async (data) => {
    const confirmDelete = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Anda yakin ingin menghapus Transaksi ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (confirmDelete.isConfirmed) {
      setIsLoad(true);
      try {
        const itemRef = doc(db, "items", data.itemId);
        const categoryRef = doc(db, "category", data.categoryId);

        // Jalankan transaction
        await runTransaction(db, async (transaction) => {
          // Dapatkan data inventory terkait
          const dataItems = await getInventory(itemRef);
          if (!dataItems) {
            throw new Error("Inventory data not found.");
          }

          const dataRef = doc(db, `transactions${cabang}`, data.id);

          // Hapus dokumen dari Firestore (transactions)
          transaction.delete(dataRef);

          // Periksa apakah itemId sesuai dengan pengecualian
          if (
            data.itemId !== "GBwAvYWhBOpnvkUBDCV6" &&
            data.itemId !== "zYIsvQcu1HFFYBsfnCF7"
          ) {
            // Data yang akan ditambahkan ke historyInventory
            const dateInput = dayjs().format("DD/MM/YYYY");
            const timeInput = dayjs().format("HH:mm");
            const monthInput = dayjs().format("MMMM");
            const yearInput = dayjs().format("YYYY");

            const historyData = {
              refItem: itemRef,
              refCategory: categoryRef,
              stock: parseInt(data.quantity),
              dateUpdate: tanggal,
              info: `Penghapusan Data Transaksi ${
                data.item.itemName
              } Sejumlah ${data.quantity} dengan Total Harga ${formatRupiah(
                parseInt(data.quantity) * parseInt(data.price)
              )} Oleh ${nama}`,
              dateInput: dateInput,
              timeInput: timeInput,
              month: monthInput,
              year: yearInput,
              status: "Stok Masuk",
            };

            // Tambahkan data ke historyInventory
            transaction.set(
              doc(collection(db, `historyInventory${cabang}`)),
              historyData
            );

            // Update stok di inventory
            const newStock = parseInt(data.quantity) + dataItems.stock;
            transaction.update(doc(db, `inventorys${cabang}`, dataItems.id), {
              stock: newStock,
              dateUpdate: tanggal,
            });
          }
        });

        setIsLoad(false);
        Swal.fire({
          title: "Sukses!",
          text: "Transaksi berhasil dihapus.",
          icon: "success",
          confirmButtonText: "OK",
        });
        getTransactions();
      } catch (error) {
        console.error("Error deleting transaksi:", error.message);
        setIsLoad(false);

        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat menghapus transaksi.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };

  const handleUpdate = async (transaction) => {
    setIsLoad(true);

    // Tampilkan SweetAlert konfirmasi
    const result = await Swal.fire({
      title: "Apakah Anda Yakin?",
      text: `Apakah Piutang Sudah dibayarkan?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya",
      cancelButtonText: "Tidak",
    });

    if (result.isConfirmed) {
      try {
        // Referensi dokumen yang akan di-update
        const transactionRef = doc(db, `transactions${cabang}`, transaction.id);

        // Lakukan update pada dokumen tersebut
        await updateDoc(transactionRef, {
          isBayar: true,
        });

        setIsLoad(false);
        getTransactions(bulan, tahun);
        Swal.fire("Berhasil!", `Data transaksi telah diceklis.`, "success");

        console.log("Transaction updated successfully");
      } catch (error) {
        setIsLoad(false);

        console.error("Error updating transaction: ", error);
        Swal.fire(
          "Gagal!",
          "Terjadi kesalahan saat memperbarui data transaksi.",
          "error"
        );
      }
    } else {
      setIsLoad(false);
      console.log("Update transaksi dibatalkan");
    }
  };

  const handleTabChange = (index) => {
    setActiveTabIndex(`tab${index + 1}`);
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
  const formattedDate = (value) => {
    const formattedDate = dayjs(value, "DD/MM/YYYY").format("D MMMM YYYY");
    return formattedDate;
  };
  const columns = [
    {
      name: "date",
      label: "Tanggal",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "itemName",
      label: "Barang",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "user",
      label: "Pengecek",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "total",
      label: "Total",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          const price = formatRupiah(value);
          return price; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },

    {
      name: "type",
      label: "Dari",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan

          const string = `Cek ${value}`;
          return string; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },
    {
      name: "data",
      label: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-start gap-2 items-center">
              {value.isBayar == true ? (
                <>
                  <label className="container">
                    <input type="checkbox" checked={true} />
                    <div className="checkmark"></div>
                  </label>
                </>
              ) : (
                <>
                  <button
                    className="Btn-see text-white"
                    onClick={() => {
                      handleUpdate(value);
                    }}
                  >
                    <span className="svgContainer">
                      <FaCheck className="text-xl " />
                    </span>
                    <span className="BG bg-teal-500"></span>
                  </button>
                  <button
                    className="Btn-see text-white"
                    onClick={() => {
                      handleDelete(value); // Kirim objek lengkap
                    }}
                  >
                    <span className="svgContainer">
                      <MdDelete className="text-xl " />
                    </span>
                    <span className="BG bg-red-500"></span>
                  </button>
                  <div className="flex justify-start gap-4 items-center">
                    <button
                      className="Btn-see text-white"
                      onClick={() => {
                        handleDetailData(value); // Kirim objek lengkap
                      }}
                    >
                      <span className="svgContainer">
                        <IoEyeSharp className="text-xl " />
                      </span>
                      <span className="BG bg-blue-600"></span>
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    },
  ];

  const columnsOther = [
    {
      name: "date",
      label: "Tanggal",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "itemName",
      label: "Barang",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "user",
      label: "Pengecek",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          return value; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },

    {
      name: "total",
      label: "Total",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          const totalprice = formatRupiah(value);
          return totalprice; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },
    {
      name: "data",
      label: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              <button
                className="Btn-see text-white"
                onClick={() => {
                  handleDelete(value); // Kirim objek lengkap
                }}
              >
                <span className="svgContainer">
                  <MdDelete className="text-xl " />
                </span>
                <span className="BG bg-red-500"></span>
              </button>
              <div className="flex justify-start gap-4 items-center">
                <button
                  className="Btn-see text-white"
                  onClick={() => {
                    handleDetailData(value); // Kirim objek lengkap
                  }}
                >
                  <span className="svgContainer">
                    <IoEyeSharp className="text-xl " />
                  </span>
                  <span className="BG bg-blue-600"></span>
                </button>
              </div>
            </div>
          );
        },
      },
    },
  ];

  const dataPi = dataPiutang.map((a) => {
    return {
      date: a.date,
      itemName: a.item.itemName,
      user: a.user,
      total: a.total,
      type: a.type,
      data: a,
    };
  });
  const dataOth = dataOther.map((a) => {
    return {
      date: a.date,
      itemName: a.item.itemName,
      user: a.user,
      total: a.total,
      data: a,
    };
  });

  const allTabs = [
    {
      id: "tab1",
      name: "Piutang",
    },
    {
      id: "tab2",
      name: "Pendapatan Lain-lain",
    },
  ];

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
            <div
              ref={targetRef}
              className="w-full h-full flex flex-col justify-start items-center pb-25"
            >
              <div
                data-aos="slide-down"
                data-aos-delay="50"
                className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
              >
                <h3 className="text-white text-base font-normal">
                  Laporan Transaksi Lain-lain
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
                      {dataTransaction.length} Transaksi
                    </h3>
                  </div>
                  <h3 className="text-xs font-normal text-white w-full">
                    Total Transaksi
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
                        <h3 className="text-xl font-medium">
                          {formatRupiah(totalNominalLain + totalNominalPiutang)}
                        </h3>
                      </div>
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xs font-normal">
                          Total Nominal Transaksi
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
                  className="w-[30%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
                >
                  <div className="w-full flex justify-between items-start ">
                    <h3 className="text-base font-medium">Piutang</h3>
                    <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                      <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between items-start gap-1">
                    <h3 className="text-xl font-medium">
                      {formatRupiah(totalNominalPiutang)}
                    </h3>
                    <h3 className="text-xs font-medium">Transaksi Piutang</h3>
                  </div>
                </div>

                <div
                  data-aos="fade-up"
                  data-aos-delay="550"
                  className="w-[30%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
                >
                  <div className="w-full flex justify-between items-start ">
                    <h3 className="text-base font-medium">Pendapatan Lain</h3>
                    <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                      <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between items-start gap-1">
                    <h3 className="text-xl font-medium">
                      {formatRupiah(totalNominalLain)}
                    </h3>

                    <h3 className="text-xs font-medium">
                      Transaksi Pendapatan Lain
                    </h3>
                  </div>
                </div>
              </div>

              <div
                data-aos="fade-up"
                data-aos-delay="750"
                className="w-[100%] flex justify-start items-center gap-6 bg-white rounded-xl p-4 mb-5"
              >
                <div className="flex justify-start gap-4 items-center">
                  <p className="text-sm font-normal">Pilih Bulan</p>
                  <Space direction="vertical" size={12}>
                    <DatePicker
                      defaultValue={dayjs(bulan, "MMMM")}
                      format={["MMMM"]}
                      picker="month"
                      onChange={(date) => {
                        setBulan(date.format("MMMM"));
                        // getHistoryInventory(date.format("MMMM"), tahun);
                      }}
                      className="w-[10rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                    />
                  </Space>
                </div>
                <div className="flex justify-start gap-4 items-center">
                  <p className="text-sm font-normal">Pilih Tahun</p>
                  <Space direction="vertical" size={12}>
                    <DatePicker
                      defaultValue={dayjs(tahun, "YYYY")}
                      format={["YYYY"]}
                      picker="year"
                      onChange={(date) => {
                        setTahun(date.format("YYYY"));
                      }}
                      className="w-[10rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                    />
                  </Space>
                </div>
                <button
                  onClick={() => {
                    getTransactions(bulan, tahun);
                  }}
                  type="button"
                  className="bg-blue-500 text-center w-[10rem] rounded-2xl h-10 relative text-black text-xs font-medium group"
                >
                  <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[95%] z-10 duration-500">
                    <IoSearch className="text-[18px] text-blue-700 hover:text-blue-700" />
                  </div>
                  <p className="translate-x-2 text-[0.65rem] text-white">
                    Cari Data
                  </p>
                </button>
              </div>

              <div
                className={`w-full ${
                  !isDetail ? "h-0 p-0" : "h-[auto]  p-6 mt-3  mb-5"
                } duration-500 flex-col justify-start items-start rounded-md bg-white shadow-md `}
              >
                <div
                  className={`w-full  ${
                    !isDetail ? "hidden" : "flex flex-col "
                  } justify-start items-start gap-4`}
                >
                  <div className=" w-full flex justify-start gap-6">
                    <div className=" flex flex-col justify-center items-start gap-2 w-[11rem]">
                      <h5 className="text-base font-medium ">Nama Barang</h5>
                      <p className="text-xs font-normal ">
                        {dataDetail != null ? dataDetail.item.itemName : ""}
                      </p>
                    </div>
                    <div className=" flex flex-col justify-center items-start gap-2 ">
                      <h5 className="text-base font-medium ">Nama Pengecek</h5>
                      <p className="text-xs font-normal ">
                        {dataDetail != null ? dataDetail.user : ""}
                      </p>
                    </div>
                  </div>
                  <div className=" w-full flex justify-start gap-6">
                    <div className=" flex flex-col justify-center items-start gap-2 w-[11rem]">
                      <h5 className="text-base font-medium ">
                        Tanggal Transaksi
                      </h5>
                      <p className="text-xs font-normal ">
                        {dataDetail != null
                          ? formattedDate(dataDetail.date)
                          : ""}
                      </p>
                    </div>
                    <div className=" flex flex-col justify-center items-start gap-2">
                      <h5 className="text-base font-medium ">Total</h5>
                      <p className="text-xs font-normal ">
                        {dataDetail != null
                          ? formatRupiah(dataDetail.total)
                          : ""}
                      </p>
                    </div>
                  </div>
                  <div className=" w-full flex justify-start gap-6">
                    <div className=" flex flex-col justify-center items-start gap-2 w-[11rem]">
                      <h5 className="text-base font-medium ">Asal</h5>
                      <p className="text-xs font-normal ">
                        Selisih{" "}
                        {dataDetail != null
                          ? dataDetail.type
                            ? dataDetail.type
                            : "Cash"
                          : ""}
                      </p>
                    </div>
                    <div className=" flex flex-col justify-center items-start gap-2">
                      <h5 className="text-base font-medium ">Keterangan</h5>
                      <p className="text-xs font-normal ">
                        {dataDetail != null ? dataDetail.info : ""}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <TabBar data={allTabs} onTabChange={handleTabChange} />

              {activeTabIndex == "tab1" && (
                <>
                  <div
                    // data-aos="fade-up"
                    className="w-full flex justify-center  items-start mt-5 h-[35rem] mb-28 overflow-y-scroll"
                  >
                    {isData ? (
                      <>
                        <LoaderTable />
                      </>
                    ) : (
                      <>
                        <Paper style={{ height: 400, width: "100%" }}>
                          <MUIDataTable
                            columns={columns}
                            data={dataPi}
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

              {activeTabIndex == "tab2" && (
                <>
                  <div
                    // data-aos="fade-up"
                    className="w-full flex justify-center  items-start mt-5 h-[35rem] mb-28 overflow-y-scroll"
                  >
                    {isData ? (
                      <>
                        <LoaderTable />
                      </>
                    ) : (
                      <>
                        <Paper style={{ height: 400, width: "100%" }}>
                          <MUIDataTable
                            columns={columnsOther}
                            data={dataOth}
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

              {/* end tutup */}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default OtherIncomeReport;
