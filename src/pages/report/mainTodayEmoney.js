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
function TodayEmoney() {
  const [isCek, setIsCek] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [isOpen, setIsOpen] = useState(false);

  const [nominalTransaksi, setNominalTransaksi] = useState(0);
  const [selisih, setSelisih] = useState("");
  const [jenisPembayaran, setJenisPembayaran] = useState(null);
  const [indexDetail, setIndexDetail] = useState(0);

  const [dataTransaction, setDataTransaction] = useState([]);
  const [transUncheck, setTransUncheck] = useState([]);
  const [dataTarik, setDataTarik] = useState([]);
  const [dataTopup, setDataTopup] = useState([]);
  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const [totalNominal, setTotalNominal] = useState(0);
  const [totalAdminLuar, setTotalAdminLuar] = useState(0);
  const [totalAdminDalam, setTotalAdminDalam] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalSisaFisik, setTotalSisaFisik] = useState(0);
  const [totalNominalTarik, setTotalNominalTarik] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);
  const [totalNominalTopup, setTotalNominalTopup] = useState(0);
  const [itemTerlaris, setitemTerlaris] = useState({});
  const [activeTabIndex, setActiveTabIndex] = useState("tab1");
  const [selectedItems, setSelectedItems] = useState([]);
  const nama = sessionStorage.getItem("nama");
  const [isData, setIsData] = useState(true);
  const [isLoad, setIsLoad] = useState(false);
  const cabang = sessionStorage.getItem("cabang");

  useEffect(() => {
    getTransactions();
  }, []);

  const getTransactions = async () => {
    try {
      // Buat query dengan filter where
      const transactionsQuery = query(
        collection(db, `transactions${cabang}`),
        where("date", "==", tanggal)
      );

      const querySnapshot = await getDocs(transactionsQuery);
      // Jika tidak ada dokumen yang ditemukan, kembalikan array kosong
      if (querySnapshot.empty) {
        console.log("No transactions found for the given month and year.");
        setTransUncheck([]);
        setTotalQris(0);
        setTotalTransfer(0);
        setDataTarik([]);
        setDataTopup([]);
        setitemTerlaris({});
        setDataTransaction([]);
        setTotalNominal(0);
        setTotalNominalTarik(0);
        setTotalNominalTopup(0);
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

      const dataEmoney = transactions.filter(
        (a) => a.category.nameCategory == "E-Money"
      );

      if (dataEmoney.length > 0) {
        const transactionTarik = dataEmoney.filter(
          (a) => a.type == "Tarik Dana"
        );
        const transactionTopup = dataEmoney.filter((a) => a.type == "Topup");
        const transactionUnCheck = dataEmoney.filter(
          (a) => a.isCheck == false || !a.isCheck
        );

        const profitTotal = dataEmoney
          .filter((a) => a.itemId != "GBwAvYWhBOpnvkUBDCV6")
          .reduce((acc, transaction) => acc + transaction.adminFee, 0);
        // Menghitung total dari semua transaksi
        const totalNominal = dataEmoney
          .filter((a) => a.itemId != "GBwAvYWhBOpnvkUBDCV6")
          .reduce((acc, transaction) => acc + transaction.total, 0);

        // Menghitung total untuk payment "Tunai"
        const totalTarik = dataEmoney
          .filter(
            (transaction) =>
              transaction.type === "Tarik Dana" &&
              transaction.itemId != "GBwAvYWhBOpnvkUBDCV6"
          )
          .reduce((acc, transaction) => acc + transaction.total, 0);

        const totalNominTarikLuar = transactionTarik
          .filter((transaction) => transaction.payment == "Admin Luar")
          .reduce((acc, transaction) => acc + transaction.price, 0);
        const totalNominTarikDalam = transactionTarik
          .filter((transaction) => transaction.payment == "Admin Dalam")
          .reduce((acc, transaction) => acc + transaction.price, 0);
        const totalTarikLuar = transactionTarik
          .filter((transaction) => transaction.payment == "Admin Luar")
          .reduce(
            (acc, transaction) =>
              acc +
              (parseInt(transaction.price) -
                parseInt(transaction.adminFee) * 2),
            0
          );

        const totalTarikDalam = transactionTarik
          .filter((transaction) => transaction.payment == "Admin Dalam")
          .reduce(
            (acc, transaction) =>
              acc +
              (parseInt(transaction.price) - parseInt(transaction.adminFee)),
            0
          );
        // Menghitung total untuk payment selain "Tunai"
        const totalTopup = dataEmoney
          .filter(
            (transaction) =>
              transaction.type == "Topup" &&
              transaction.itemId != "GBwAvYWhBOpnvkUBDCV6"
          )
          .reduce((acc, transaction) => acc + transaction.total, 0);

        const sisaFisik =
          parseInt(totalTopup) -
          parseInt(totalTarikLuar) -
          parseInt(totalTarikDalam);
        // Kelompokkan data berdasarkan refItem
        const groupedByItem = dataEmoney.reduce((acc, transaction) => {
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

        console.log("Most Frequent Item:", mostFrequentItem);
        setTotalProfit(profitTotal);
        setTransUncheck(transactionUnCheck);
        setTotalQris(totalQris);
        setTotalAdminLuar(totalNominTarikLuar);
        setTotalAdminDalam(totalNominTarikDalam);
        setTotalSisaFisik(sisaFisik <= 0 ? 0 : sisaFisik);
        setTotalProfit(profitTotal);
        setDataTarik(transactionTarik);
        setIsData(false);
        setDataTopup(transactionTopup);
        setitemTerlaris(mostFrequentItem);
        setDataTransaction(dataEmoney); // Simpan transaksi ke state
        setTotalNominal(totalNominal); // Simpan total nominal ke state
        setTotalNominalTarik(totalTarik); // Simpan total nominal tunai ke state
        setTotalNominalTopup(totalTopup); // Simpan total nominal non-tunai ke state
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

          // Tambahkan data ke historyInventory
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

  const handleCheck = (item) => {
    // Cek jika item sudah ada dalam selectedItems
    if (!selectedItems.some((selectedItem) => selectedItem.id === item.id)) {
      setSelectedItems([...selectedItems, item]); // Tambahkan item ke array
    } else {
      // Jika sudah ada, hapus dari selectedItems
      setSelectedItems(
        selectedItems.filter((selectedItem) => selectedItem.id !== item.id)
      );
    }
  };

  const handleUpdate = async () => {
    setIsLoad(true);
    console.log(selectedItems);
    let data = [];
    if (selectedItems.length === 0) {
      data = transUncheck;
    } else {
      data = selectedItems;
    }

    // Tampilkan SweetAlert konfirmasi
    const result = await Swal.fire({
      title: "Apakah Anda Yakin?",
      text: `Apakah Anda Yakin Untuk Menceklis ${data.length} data Transaksi?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, ceklis!",
      cancelButtonText: "Tidak",
    });

    if (result.isConfirmed) {
      try {
        // Buat array promises untuk semua operasi updateDoc
        const updatePromises = data.map(async (transaction) => {
          const transactionRef = doc(
            db,
            `transactions${cabang}`,
            transaction.id
          );
          return updateDoc(transactionRef, {
            isCheck: true,
            checker: nama,
          });
        });

        // Jalankan semua promises secara paralel
        await Promise.all(updatePromises);
        setIsLoad(false);
        getTransactions();
        Swal.fire(
          "Berhasil!",
          `${data.length} data transaksi telah diceklis.`,
          "success"
        );

        console.log("All transactions updated successfully");
      } catch (error) {
        setIsLoad(false);

        console.error("Error updating transactions: ", error);
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
  const columns = [
    {
      name: "data",
      label: "Transaksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value.item.itemName}{" "}
              {formatRupiah(parseInt(value.price) - parseInt(value.adminFee))}
            </button>
          );
        },
      },
    },
    {
      name: "adminfee",
      label: "Admin",
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
      name: "payment",
      label: "Pembayaran",
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
      name: "data",
      label: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              {value.isCheck == true ? (
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
                      handleDelete(value); // Kirim objek lengkap
                    }}
                  >
                    <span className="svgContainer">
                      <MdDelete className="text-xl " />
                    </span>
                    <span className="BG bg-red-500"></span>
                  </button>
                  {/* <div className="flex justify-start gap-4 items-center">
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
              </div> */}
                </>
              )}
            </div>
          );
        },
      },
    },
  ];

  const columnsAll = [
    {
      name: "data",
      label: "Transaksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value.item.itemName}{" "}
              {formatRupiah(parseInt(value.price) - parseInt(value.adminFee))}
            </button>
          );
        },
      },
    },

    {
      name: "adminfee",
      label: "Admin",
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
      name: "type",
      label: "Jenis",
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
    {
      name: "data",
      label: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              {value.isCheck == true ? (
                <>
                  <label className="container">
                    <input type="checkbox" checked={true} />
                    <div className="checkmark"></div>
                  </label>
                </>
              ) : (
                <>
                  <label className="container">
                    <input
                      type="checkbox"
                      onChange={() => handleCheck(value)}
                      checked={selectedItems.some(
                        (selectedItem) => selectedItem.id === value.id
                      )}
                    />
                    <div className="checkmark"></div>
                  </label>
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
                </>
              )}
            </div>
          );
        },
      },
    },
  ];
  const columnsTopup = [
    {
      name: "data",
      label: "Transaksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button className="flex justify-start items-center gap-2 w-full">
              {value.item.itemName}{" "}
              {formatRupiah(parseInt(value.price) - parseInt(value.adminFee))}
            </button>
          );
        },
      },
    },
    {
      name: "adminfee",
      label: "Admin",
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
      name: "payment",
      label: "Pembayaran",
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
      name: "data",
      label: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              {value.isCheck == true ? (
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
                      handleDelete(value); // Kirim objek lengkap
                    }}
                  >
                    <span className="svgContainer">
                      <MdDelete className="text-xl " />
                    </span>
                    <span className="BG bg-red-500"></span>
                  </button>
                  {/* <div className="flex justify-start gap-4 items-center">
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
              </div> */}
                </>
              )}
            </div>
          );
        },
      },
    },
  ];

  const dataAll = dataTransaction.map((a) => {
    return {
      itemName: a.item.itemName,
      jumlah: a.quantity,
      harga: a.price,
      payment: a.payment,
      adminfee: a.adminFee,
      type: a.type,
      data: a,
    };
  });
  const dataCash = dataTarik.map((a) => {
    return {
      itemName: a.item.itemName,
      jumlah: a.quantity,
      harga: a.price,
      payment: a.payment,
      adminfee: a.adminFee,
      type: a.type,
      data: a,
    };
  });

  const dataNonCash = dataTopup.map((a) => {
    return {
      itemName: a.item.itemName,
      jumlah: a.quantity,
      harga: a.price,
      payment: a.payment,
      adminfee: a.adminFee,
      type: a.type,
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
      name: "Transaksi Tarik",
    },
    {
      id: "tab3",
      name: "Transaksi Topup",
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
            <div className="w-full h-full flex flex-col justify-start items-center pb-25">
              <div
                data-aos="slide-down"
                data-aos-delay="50"
                className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
              >
                <h3 className="text-white text-base font-normal">
                  Laporan Transaksi E-Money Hari Ini
                </h3>
              </div>
              <div className="w-full flex justify-start gap-6 items-center mt-10 h-full">
                <div
                  data-aos="fade-up"
                  data-aos-delay="250"
                  className="cookieCard w-[33%]"
                >
                  <div className="cookieDescription">
                    <h3 className="text-xl font-medium">
                      {dataTransaction.length} Transaksi
                    </h3>
                  </div>
                  <h3 className="text-xs font-normal text-white w-full">
                    Total Transaksi Hari Ini
                  </h3>
                  <div className="z-[9999] absolute right-[5%] p-4 flex justify-center items-center bg-white  rounded-full">
                    <FaLuggageCart className="text-blue-700 text-[2rem]" />
                  </div>
                </div>
                <div
                  data-aos="fade-up"
                  data-aos-delay="350"
                  className="w-[33%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
                >
                  <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
                    <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xl font-medium">
                          {formatRupiah(totalProfit)}
                        </h3>
                      </div>
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xs font-normal">
                          Nominal Profit Hari Ini
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
                <div
                  data-aos="fade-up"
                  data-aos-delay="350"
                  className="w-[33%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
                >
                  <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
                    <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xl font-medium">
                          {formatRupiah(totalSisaFisik)}
                        </h3>
                      </div>
                      <div className="w-full flex justify-start gap-4 items-center">
                        <h3 className="text-xs font-normal">
                          Nominal Sisa Fisik
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

              {/* tutup */}

              <div className="w-full flex justify-between items-center   rounded-md mt-5 gap-6 mb-5">
                <div
                  data-aos="fade-up"
                  data-aos-delay="450"
                  className="w-[33%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
                >
                  <div className="w-full flex justify-between items-start ">
                    <h3 className="text-base font-medium">Tarik E-Money</h3>
                    <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                      <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between items-start gap-1">
                    <h3 className="text-xl font-medium">
                      {formatRupiah(totalNominalTarik)}
                    </h3>
                    <h3 className="text-xs font-medium">
                      Transaksi Tarik E-Money
                    </h3>
                  </div>
                </div>

                <div
                  data-aos="fade-up"
                  data-aos-delay="550"
                  className="w-[33%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
                >
                  <div className="w-full flex justify-between items-start ">
                    <h3 className="text-base font-medium">Topup E-Money</h3>
                    <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                      <GiReceiveMoney className="text-blue-600 text-[2.3rem]" />
                    </div>
                  </div>
                  <div className="w-full flex flex-col justify-between items-start gap-1">
                    <h3 className="text-xl font-medium">
                      {formatRupiah(totalNominalTopup)}
                    </h3>

                    <h3 className="text-xs font-medium">
                      Transaksi Topup E-Money
                    </h3>
                  </div>
                </div>

                <div
                  data-aos="fade-up"
                  data-aos-delay="650"
                  className="w-[33%] flex flex-col justify-start items-center gap-2 py-4 px-4 h-[8rem] bg-blue-500 rounded-xl shadow-md text-white"
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
                    <h3 className="text-xs font-medium">
                      Total Nominal Semua Transaksi
                    </h3>
                  </div>
                </div>
              </div>

              <div
                data-aos="fade-up"
                data-aos-delay="750"
                className="w-full flex justify-end items-center  p-2 rounded-md"
              >
                <div>
                  <button
                    onClick={handleUpdate}
                    type="button"
                    class="bg-blue-500 text-center w-[14rem] rounded-2xl h-10 relative  text-black text-xl font-semibold group"
                  >
                    <div class="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[214px] z-10 duration-500">
                      <IoAddCircleOutline className="text-[25px] text-blue-700 hover:text-blue-700" />
                    </div>
                    <p class="translate-x-2 text-xs text-white">
                      Ceklis Transaksi
                    </p>
                  </button>
                </div>
              </div>
              <TabBar data={allTabs} onTabChange={handleTabChange} />

              {activeTabIndex == "tab1" && (
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

              {activeTabIndex == "tab3" && (
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
                            columns={columnsTopup}
                            data={dataNonCash}
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
                    className="w-full p-2 flex justify-start gap-6 items-center mt-5"
                  >
                    <div className="flex justify-start items-start p-4 bg-blue-600 shadow-lg pr-16 text-white rounded-xl flex-col gap-2">
                      <h3 className="text-base font-medium">
                        {formatRupiah(totalAdminDalam)}
                      </h3>
                      <p className="text-xs font-normal">
                        Total Nominal Admin Dalam
                      </p>
                    </div>
                    <div className="flex justify-start items-start p-4 bg-blue-600 shadow-lg pr-16 text-white rounded-xl flex-col gap-2">
                      <h3 className="text-base font-medium">
                        {formatRupiah(totalAdminLuar)}
                      </h3>
                      <p className="text-xs font-normal">
                        Total Nominal Admin Luar
                      </p>
                    </div>
                  </div>
                  <div className="w-full flex justify-center  items-center mt-5 h-full mb-40">
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

export default TodayEmoney;
