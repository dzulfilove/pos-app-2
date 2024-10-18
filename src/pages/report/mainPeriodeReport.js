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
import { IoSearch } from "react-icons/io5";
import { FaArrowTrendUp } from "react-icons/fa6";
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
import { DatePicker, Space } from "antd";
import { db } from "../../config/database";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import { IoEyeSharp } from "react-icons/io5";
import { TabBar } from "../../component/features/tabBar";
import AOS from "aos";
import "aos/dist/aos.css";
import LoaderTable from "../../component/features/loader2";
function PeriodeReport() {
  const [isEdit, setIsEdit] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [jumlahBarang, setJumlahBarang] = useState(0);
  const [harga, setHarga] = useState(0);
  const [jenisPembayaran, setJenisPembayaran] = useState(null);
  const [indexDetail, setIndexDetail] = useState(0);
  const [dataBarang, setDataBarang] = useState([]);
  const [dataTransaction, setDataTransaction] = useState([]);
  const [transUncheck, setTransUncheck] = useState([]);
  const [dataTunai, setDataTunai] = useState([]);
  const [dataNonTunai, setDataNonTunai] = useState([]);
  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const cabang = sessionStorage.getItem("cabang");

  const [totalProfit, setTotalProfit] = useState(0);

  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const [totalNominal, setTotalNominal] = useState(0);
  const [totalNominalTunai, setTotalNominalTunai] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);
  const [totalNominalNonTunai, setTotalNominalNonTunai] = useState(0);
  const [itemTerlaris, setItemTerlaris] = useState({});
  const [activeTabIndex, setActiveTabIndex] = useState("tab1");
  const [selectedItems, setSelectedItems] = useState([]);
  const [isData, setIsData] = useState(true);
  const targetRef = useRef(null);

  useEffect(() => {
    getTransactions(bulan, tahun);
    scrollToTarget();
  }, []);
  const scrollToTarget = () => {
    targetRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const getTransactions = async (month, year) => {
    setIsData(true);
    try {
      // Buat query dengan filter where untuk bulan dan tahun
      const transactionsQuery = query(
        collection(db, `transactions${cabang}`),
        where("month", "==", month), // Ganti kondisi where untuk bulan
        where("year", "==", year) // Ganti kondisi where untuk tahun
      );

      const querySnapshot = await getDocs(transactionsQuery);

      // Jika tidak ada dokumen yang ditemukan, kembalikan array kosong
      if (querySnapshot.empty) {
        console.log("No transactions found for the given month and year.");
        setIsData(false);
        setTransUncheck([]);
        setTotalQris(0);
        setTotalTransfer(0);
        setDataTunai([]);
        setDataNonTunai([]);
        setItemTerlaris({});
        setDataTransaction([]);
        setTotalNominal(0);
        setTotalNominalTunai(0);
        setTotalNominalNonTunai(0);
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

          if (categoryData.nameCategory == "E-Money") {
            profit = data.adminFee;
          }

          if (
            itemData.itemName.toLowerCase().includes("pendapatan") ||
            itemData.itemName.toLowerCase().includes("piutang")
          ) {
            profit = total;
          }

          if (
            !itemData.itemName.toLowerCase().includes("pendapatan") &&
            !itemData.itemName.toLowerCase().includes("piutang") &&
            !categoryData.isCash
          ) {
            profit = total - data.quantity * itemData.buyPrice;
          }

          if (
            !itemData.itemName.toLowerCase().includes("pendapatan") &&
            !itemData.itemName.toLowerCase().includes("piutang") &&
            categoryData.isCash
          ) {
            profit = data.adminFee;
          }
          if (
            !itemData.itemName.toLowerCase().includes("pendapatan") &&
            !itemData.itemName.toLowerCase().includes("piutang") &&
            categoryData.isIncome
          ) {
            profit = data.income;
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

      const totalNominal = transactions
        .filter((a) => !a.item.itemName.toLowerCase().includes("piutang"))
        .reduce((acc, transaction) => acc + transaction.total, 0);

      const totalPiutang = transactions
        .filter((a) => a.item.itemName.toLowerCase().includes("piutang"))
        .reduce((acc, transaction) => acc + transaction.total, 0);

      const profitTotal = transactions
        .filter((a) => !a.item.itemName.toLowerCase().includes("piutang"))
        .reduce((acc, transaction) => acc + transaction.profit, 0);
      // Menghitung total untuk payment "Tunai"
      const totalNominalTunai = transactions
        .filter(
          (transaction) =>
            transaction.payment === "Tunai" &&
            !transaction.item.itemName.toLowerCase().includes("piutang")
        )
        .reduce((acc, transaction) => acc + transaction.total, 0);

      // Menghitung total untuk payment selain "Tunai"
      const totalNominalNonTunai = transactions
        .filter(
          (transaction) =>
            transaction.payment !== "Tunai" &&
            !transaction.item.itemName.toLowerCase().includes("piutang")
        )
        .reduce((acc, transaction) => acc + transaction.total, 0);

      // Kelompokkan data berdasarkan refItem
      const groupedByItem = transactions.reduce((acc, transaction) => {
        const itemId = transaction.itemId;
        if (!acc[itemId]) {
          acc[itemId] = {
            itemId: itemId,
            itemName: transaction.item.itemName,
            unit: transaction.item.unit,
            jumlahTransaksi: 0,
            totalBarang: 0,
            dataTransaksi: [],
          };
        }
        acc[itemId].jumlahTransaksi += 1;
        acc[itemId].totalBarang += transaction.quantity;
        acc[itemId].dataTransaksi.push(transaction);
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

      const transactionTunai = transactions.filter((a) => a.payment == "Tunai");
      const transactionNonTunai = transactions.filter(
        (a) => a.payment != "Tunai"
      );
      const transactionUnCheck = transactions.filter(
        (a) => a.isCheck == false || !a.isCheck
      );

      // Menghitung total untuk payment selain "Tunai"
      const totalQris = transactionNonTunai
        .filter((transaction) => transaction.payment == "QRIS")
        .reduce((acc, transaction) => acc + transaction.total, 0);

      const totalTransfer = transactionNonTunai
        .filter((transaction) => transaction.payment !== "QRIS")
        .reduce((acc, transaction) => acc + transaction.total, 0);

      const sortedTransactions = transactions.sort((a, b) => {
        // Pecah dan urutkan berdasarkan tanggal (DD/MM/YYYY)
        const [aDay, aMonth, aYear] = a.date.split("/").map(Number);
        const [bDay, bMonth, bYear] = b.date.split("/").map(Number);

        // Urutkan berdasarkan tahun, bulan, dan hari terlebih dahulu
        if (aYear !== bYear) return bYear - aYear;
        if (aMonth !== bMonth) return bMonth - aMonth;
        if (aDay !== bDay) return bDay - aDay;

        // Jika tanggal sama, lanjutkan dengan urutan waktu (HH:mm)
        const [aHours, aMinutes] = a.time.split(":").map(Number);
        const [bHours, bMinutes] = b.time.split(":").map(Number);

        return bHours - aHours || bMinutes - aMinutes;
      });

      const sortedUncheck = transactionUnCheck.sort((a, b) => {
        // Pecah dan urutkan berdasarkan tanggal (DD/MM/YYYY)
        const [aDay, aMonth, aYear] = a.date.split("/").map(Number);
        const [bDay, bMonth, bYear] = b.date.split("/").map(Number);

        // Urutkan berdasarkan tahun, bulan, dan hari terlebih dahulu
        if (aYear !== bYear) return bYear - aYear;
        if (aMonth !== bMonth) return bMonth - aMonth;
        if (aDay !== bDay) return bDay - aDay;

        // Jika tanggal sama, lanjutkan dengan urutan waktu (HH:mm)
        const [aHours, aMinutes] = a.time.split(":").map(Number);
        const [bHours, bMinutes] = b.time.split(":").map(Number);

        return bHours - aHours || bMinutes - aMinutes;
      });

      const sortedTunai = transactionTunai.sort((a, b) => {
        // Pecah dan urutkan berdasarkan tanggal (DD/MM/YYYY)
        const [aDay, aMonth, aYear] = a.date.split("/").map(Number);
        const [bDay, bMonth, bYear] = b.date.split("/").map(Number);

        // Urutkan berdasarkan tahun, bulan, dan hari terlebih dahulu
        if (aYear !== bYear) return bYear - aYear;
        if (aMonth !== bMonth) return bMonth - aMonth;
        if (aDay !== bDay) return bDay - aDay;

        // Jika tanggal sama, lanjutkan dengan urutan waktu (HH:mm)
        const [aHours, aMinutes] = a.time.split(":").map(Number);
        const [bHours, bMinutes] = b.time.split(":").map(Number);

        return bHours - aHours || bMinutes - aMinutes;
      });

      const sortedNonTunai = transactionNonTunai.sort((a, b) => {
        // Pecah dan urutkan berdasarkan tanggal (DD/MM/YYYY)
        const [aDay, aMonth, aYear] = a.date.split("/").map(Number);
        const [bDay, bMonth, bYear] = b.date.split("/").map(Number);

        // Urutkan berdasarkan tahun, bulan, dan hari terlebih dahulu
        if (aYear !== bYear) return bYear - aYear;
        if (aMonth !== bMonth) return bMonth - aMonth;
        if (aDay !== bDay) return bDay - aDay;

        // Jika tanggal sama, lanjutkan dengan urutan waktu (HH:mm)
        const [aHours, aMinutes] = a.time.split(":").map(Number);
        const [bHours, bMinutes] = b.time.split(":").map(Number);

        return bHours - aHours || bMinutes - aMinutes;
      });
      console.log("Most Frequent Item:", sortedTransactions);
      setTotalProfit(profitTotal);
      setTransUncheck(sortedUncheck);
      setTotalQris(totalQris);
      setTotalTransfer(totalTransfer);
      setIsData(false);
      setDataTunai(sortedTunai);
      setDataNonTunai(sortedNonTunai);
      setItemTerlaris(mostFrequentItem);
      setDataTransaction(sortedTransactions);
      setTotalNominal(totalNominal);
      setTotalNominalTunai(totalNominalTunai);
      setTotalNominalNonTunai(totalNominalNonTunai);
    } catch (e) {
      setIsData(false);

      Swal.fire({
        title: "Error!",
        text: "Gagal mendapatkan data: " + e.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      return [];
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
  const columns = [
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
      name: "jumlah",
      label: "Jumlah",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "harga",
      label: "Harga",
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
      name: "data",
      label: "Total",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          const total = parseInt(value.price) * parseInt(value.quantity);
          const totalprice = formatRupiah(total);
          return totalprice; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },
  ];

  const columnsAll = [
    {
      name: "itemName",
      label: "Barang",
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
      name: "jumlah",
      label: "Jumlah",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "harga",
      label: "Harga",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const price = formatRupiah(value);
          return price;
        },
      },
    },
    {
      name: "data",
      label: "Total",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          const total = parseInt(value.price) * parseInt(value.quantity);
          const totalprice = formatRupiah(total);
          return totalprice;
        },
      },
    },
    {
      name: "data",
      label: "Petugas",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              {value.checker ? (
                <>
                  <div className="flex p-2 rounded-md justify-center items-center bg-teal-100 text-teal-700 capitalize">
                    {value.checker}
                  </div>
                </>
              ) : (
                <>
                  <div className="flex p-2 rounded-md justify-center items-center bg-yellow-100 text-yellow-700">
                    Belum
                  </div>
                </>
              )}
            </div>
          );
        },
      },
    },
  ];
  const columnsNonCash = [
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
      name: "jumlah",
      label: "Jumlah",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "harga",
      label: "Harga",
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
      name: "data",
      label: "Total",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          const total = parseInt(value.price) * parseInt(value.quantity);
          const totalprice = formatRupiah(total);
          return totalprice; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },
    {
      name: "payment",
      label: "Pembayaran",
      options: {
        filter: true,
        sort: true,
      },
    },
  ];

  const dataAll = dataTransaction.map((a) => {
    return {
      itemName: a.category.isCash
        ? a.category.isIncome
          ? `${a.item.itemName} ${a.productName} 
            `
          : `${a.item.itemName} ${a.productName} `
        : a.category.nameCategory == "E-Money"
        ? `${a.type} ${a.productName}`
        : a.item.itemName,
      jumlah: a.category.isCash
        ? a.category.isIncome
          ? ` ${formatRupiah(
              parseInt(a.price) - parseInt(a.adminFee) - parseInt(a.income)
            )}`
          : ` ${formatRupiah(parseInt(a.price) - parseInt(a.adminFee))}`
        : a.category.nameCategory == "E-Money"
        ? ` ${formatRupiah(parseInt(a.price) - parseInt(a.adminFee))}`
        : a.quantity,
      harga: a.price,
      data: a,
    };
  });
  const dataCash = dataTunai.map((a) => {
    return {
      itemName: a.category.isCash
        ? a.category.isIncome
          ? `${a.item.itemName} ${a.productName} 
          `
          : `${a.item.itemName} ${a.productName} `
        : a.category.nameCategory == "E-Money"
        ? `${a.type} ${a.productName}`
        : a.item.itemName,
      jumlah: a.category.isCash
        ? a.category.isIncome
          ? ` ${formatRupiah(
              parseInt(a.price) - parseInt(a.adminFee) - parseInt(a.income)
            )}`
          : ` ${formatRupiah(parseInt(a.price) - parseInt(a.adminFee))}`
        : a.category.nameCategory == "E-Money"
        ? ` ${formatRupiah(parseInt(a.price) - parseInt(a.adminFee))}`
        : a.quantity,
      harga: a.price,
      data: a,
    };
  });

  const dataNonCash = dataNonTunai.map((a) => {
    return {
      itemName: a.category.isCash
        ? a.category.isIncome
          ? `${a.item.itemName} ${a.productName} 
            `
          : `${a.item.itemName} ${a.productName} `
        : a.category.nameCategory == "E-Money"
        ? `${a.type} ${a.productName}`
        : a.item.itemName,
      jumlah: a.category.isCash
        ? a.category.isIncome
          ? ` ${formatRupiah(
              parseInt(a.price) - parseInt(a.adminFee) - parseInt(a.income)
            )}`
          : ` ${formatRupiah(parseInt(a.price) - parseInt(a.adminFee))}`
        : a.category.nameCategory == "E-Money"
        ? ` ${formatRupiah(parseInt(a.price) - parseInt(a.adminFee))}`
        : a.quantity,
      harga: a.price,
      payment: a.payment,
      data: a,
    };
  });

  const allTabs = [
    {
      id: "tab1",
      name: "Semua Transaksi",
    },
    {
      id: "tab2",
      name: "Transaksi Tunai",
    },
    {
      id: "tab3",
      name: "Transaksi Non Tunai",
    },
  ];

  console.log(dataDetail, "Detail data");
  return (
    <div ref={targetRef}>
      {" "}
      <div>
        <div className="w-full h-full flex flex-col justify-start items-center pb-25">
          <div
            data-aos="slide-down"
            data-aos-delay="50"
            className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
          >
            <h3 className="text-white text-base font-normal">
              Laporan Transaksi Per Periode {bulan} {tahun}
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
                      {formatRupiah(totalProfit)}
                    </h3>
                  </div>
                  <div className="w-full flex justify-start gap-4 items-center">
                    <h3 className="text-xs font-normal">Nominal Profit</h3>
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
                <h3 className="text-base font-medium">Tunai</h3>
                <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                  <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                </div>
              </div>
              <div className="w-full flex flex-col justify-between items-start gap-1">
                <h3 className="text-xl font-medium">
                  {formatRupiah(totalNominalTunai)}
                </h3>
                <h3 className="text-xs font-medium">Transaksi Tunai</h3>
              </div>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="550"
              className="w-[30%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
            >
              <div className="w-full flex justify-between items-start ">
                <h3 className="text-base font-medium">Non Tunai</h3>
                <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                  <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                </div>
              </div>
              <div className="w-full flex flex-col justify-between items-start gap-1">
                <h3 className="text-xl font-medium">
                  {formatRupiah(totalNominalNonTunai)}
                </h3>

                <h3 className="text-xs font-medium">Transaksi Non Tunai</h3>
              </div>
            </div>

            <div
              data-aos="fade-up"
              data-aos-delay="650"
              className="w-[30%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
            >
              <div className="w-full flex justify-between items-start ">
                <h3 className="text-base font-medium">Nominal Transaksi</h3>
                <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                  <FaArrowTrendUp className="text-blue-600 text-[2.3rem]" />
                </div>
              </div>
              <div className="w-full flex flex-col justify-between items-start gap-1">
                <h3 className="text-xl font-medium">
                  {formatRupiah(totalNominal)}
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
          <TabBar
            data-aos="fade-up"
            data={allTabs}
            onTabChange={handleTabChange}
          />

          {activeTabIndex == "tab1" && (
            <>
              <div
                // data-aos="fade-up"
                className="w-full flex justify-center  items-start mt-5 h-[35rem] mb-28"
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

          {activeTabIndex == "tab2" && (
            <>
              <div
                // data-aos="fade-up"
                className="w-full flex justify-center  items-start mt-5 h-[35rem] mb-28 "
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
                        data={dataCash}
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
          {activeTabIndex == "tab3" && (
            <>
              <div
                // data-aos="fade-up"
                className="w-full p-2 flex justify-start gap-6 items-center mt-5"
              >
                <div className="flex justify-start items-start p-4 bg-blue-600 shadow-lg pr-16 text-white rounded-xl flex-col gap-2">
                  <h3 className="text-base font-medium">
                    {formatRupiah(totalTransfer)}
                  </h3>
                  <p className="text-xs font-normal">
                    Total Nominal Transaksi Transfer
                  </p>
                </div>
                <div className="flex justify-start items-start p-4 bg-blue-600 shadow-lg pr-16 text-white rounded-xl flex-col gap-2">
                  <h3 className="text-base font-medium">
                    {formatRupiah(totalQris)}
                  </h3>
                  <p className="text-xs font-normal">
                    Total Nominal Transaksi QRIS
                  </p>
                </div>
              </div>
              <div className="w-full flex justify-center  items-start mt-5 h-[35rem] mb-28 ">
                {isData ? (
                  <>
                    <LoaderTable />
                  </>
                ) : (
                  <>
                    <Paper style={{ height: 400, width: "100%" }}>
                      <MUIDataTable
                        columns={columnsNonCash}
                        data={dataNonCash}
                        options={{
                          fontSize: 12, // adjust font size here
                        }}
                      />
                    </Paper>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PeriodeReport;
