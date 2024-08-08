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
function TodayReport() {
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
  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const [totalNominal, setTotalNominal] = useState(0);
  const [totalNominalTunai, setTotalNominalTunai] = useState(0);
  const [totalQris, setTotalQris] = useState(0);
  const [totalTransfer, setTotalTransfer] = useState(0);
  const [totalNominalNonTunai, setTotalNominalNonTunai] = useState(0);
  const [itemTerlaris, setitemTerlaris] = useState({});
  const [activeTabIndex, setActiveTabIndex] = useState("tab1");
  const [selectedItems, setSelectedItems] = useState([]);
  const nama = sessionStorage.getItem("nama");

  useEffect(() => {
    getTransactions();
  }, []);

  const getTransactions = async () => {
    try {
      // Buat query dengan filter where
      const transactionsQuery = query(
        collection(db, "transactions"),
        where("date", "==", tanggal)
      );

      const querySnapshot = await getDocs(transactionsQuery);
      // Jika tidak ada dokumen yang ditemukan, kembalikan array kosong
      if (querySnapshot.empty) {
        console.log("No transactions found for the given month and year.");
        setTransUncheck([]);
        setTotalQris(0);
        setTotalTransfer(0);
        setDataTunai([]);
        setDataNonTunai([]);
        setitemTerlaris({});
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

          return {
            id: doc.id,
            ...data,
            item: itemData,
            category: categoryData,
            itemId: itemRef.id,
            categoryId: categoryRef.id,
            total: total, // Tambahkan properti total
          };
        })
      );

      // Menghitung total dari semua transaksi
      const totalNominal = transactions.reduce(
        (acc, transaction) => acc + transaction.total,
        0
      );

      // Menghitung total untuk payment "Tunai"
      const totalNominalTunai = transactions
        .filter((transaction) => transaction.payment === "Tunai")
        .reduce((acc, transaction) => acc + transaction.total, 0);

      // Menghitung total untuk payment selain "Tunai"
      const totalNominalNonTunai = transactions
        .filter((transaction) => transaction.payment !== "Tunai")
        .reduce((acc, transaction) => acc + transaction.total, 0);

      console.log("transactions", transactions);
      console.log("Total Nominal", totalNominal);
      console.log("Total Nominal Tunai", totalNominalTunai);
      console.log("Total Nominal Non-Tunai", totalNominalNonTunai);

      // Kelompokkan data berdasarkan refItem
      const groupedByItem = transactions.reduce((acc, transaction) => {
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

      const totalTrnsfer = transactionNonTunai
        .filter((transaction) => transaction.payment !== "QRIS")
        .reduce((acc, transaction) => acc + transaction.total, 0);

      console.log("Most Frequent Item:", mostFrequentItem);
      setTransUncheck(transactionUnCheck);
      setTotalQris(totalQris);
      setTotalTransfer(totalTrnsfer);
      setDataTunai(transactionTunai);
      setDataNonTunai(transactionNonTunai);
      setitemTerlaris(mostFrequentItem);
      setDataTransaction(transactions); // Simpan transaksi ke state
      setTotalNominal(totalNominal); // Simpan total nominal ke state
      setTotalNominalTunai(totalNominalTunai); // Simpan total nominal tunai ke state
      setTotalNominalNonTunai(totalNominalNonTunai); // Simpan total nominal non-tunai ke state
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
      try {
        // Buat referensi ke dokumen kategori yang ingin dihapus
        const dataRef = doc(db, "transactions", data.id);

        // Hapus dokumen dari Firestore
        await deleteDoc(dataRef);

        // Tampilkan alert sukses
        Swal.fire({
          title: "Sukses!",
          text: "Kategori berhasil dihapus.",
          icon: "success",
          confirmButtonText: "OK",
        });
        getTransactions();
      } catch (error) {
        console.error("Error deleting transaksi:", error.message);
        // Tampilkan alert error
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
          const transactionRef = doc(db, "transactions", transaction.id);
          return updateDoc(transactionRef, {
            isCheck: true,
            checker: nama,
          });
        });

        // Jalankan semua promises secara paralel
        await Promise.all(updatePromises);

        Swal.fire(
          "Berhasil!",
          `${data.length} data transaksi telah diceklis.`,
          "success"
        );

        console.log("All transactions updated successfully");
      } catch (error) {
        console.error("Error updating transactions: ", error);
        Swal.fire(
          "Gagal!",
          "Terjadi kesalahan saat memperbarui data transaksi.",
          "error"
        );
      }
    } else {
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
      data: a,
    };
  });
  const dataCash = dataTunai.map((a) => {
    return {
      itemName: a.item.itemName,
      jumlah: a.quantity,
      harga: a.price,
      data: a,
    };
  });

  const dataNonCash = dataNonTunai.map((a) => {
    return {
      itemName: a.item.itemName,
      jumlah: a.quantity,
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
    <div>
      {" "}
      <div>
        <div className="w-full h-full flex flex-col justify-start items-center pb-25">
          <div
            data-aos="slide-down"
            data-aos-delay="50"
            className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
          >
            <h3 className="text-white text-base font-normal">
              Laporan Transaksi Hari Ini
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
                Total Transaksi Hari Ini
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
                      {formatRupiah(totalNominal)}
                    </h3>
                  </div>
                  <div className="w-full flex justify-start gap-4 items-center">
                    <h3 className="text-xs font-normal">
                      Nominal Transaksi Hari Ini
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
                <h3 className="text-base font-medium">Item Terlaris</h3>
                <div className=" w-[2.5rem] h-[2.5rem] bg-white rounded-xl flex justify-center items-center p-3">
                  <FaArrowTrendUp className="text-blue-600 text-[2.3rem]" />
                </div>
              </div>
              <div className="w-full flex flex-col justify-between items-start gap-1">
                <h3 className="text-xl font-medium">
                  {itemTerlaris.totalBarang} {itemTerlaris.unit}
                </h3>
                <h3 className="text-xs font-medium">{itemTerlaris.itemName}</h3>
              </div>
            </div>
          </div>
          <div
            data-aos="fade-up"
            data-aos-delay="750"
            className="w-full flex justify-end items-center  p-2 rounded-md mb-5"
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
                <p class="translate-x-2 text-xs text-white">Ceklis Transaksi</p>
              </button>
            </div>
          </div>
          <TabBar data={allTabs} onTabChange={handleTabChange} />

          {activeTabIndex == "tab1" && (
            <>
              <div
                data-aos="fade-up"
                className="w-full flex justify-center  items-center mt-5 h-full mb-28"
              >
                <Paper style={{ height: 400, width: "100%" }}>
                  <MUIDataTable
                    columns={columnsAll}
                    data={dataAll}
                    options={{
                      fontSize: 12, // adjust font size here
                    }}
                    pagination
                    rowsPerPageOptions={[10, 50, { value: -1, label: "All" }]}
                  />
                </Paper>
              </div>
            </>
          )}

          {activeTabIndex == "tab2" && (
            <>
              <div
                data-aos="fade-up"
                className="w-full flex justify-center  items-center mt-5 h-full mb-28"
              >
                <Paper style={{ height: 400, width: "100%" }}>
                  <MUIDataTable
                    columns={columns}
                    data={dataCash}
                    options={{
                      fontSize: 12, // adjust font size here
                    }}
                    pagination
                    rowsPerPageOptions={[10, 50, { value: -1, label: "All" }]}
                  />
                </Paper>
              </div>
            </>
          )}
          {activeTabIndex == "tab3" && (
            <>
              <div
                data-aos="fade-up"
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
              <div className="w-full flex justify-center  items-center mt-5 h-full mb-28">
                <Paper style={{ height: 400, width: "100%" }}>
                  <MUIDataTable
                    columns={columnsNonCash}
                    data={dataNonCash}
                    options={{
                      fontSize: 12, // adjust font size here
                    }}
                    pagination
                    rowsPerPageOptions={[10, 50, { value: -1, label: "All" }]}
                  />
                </Paper>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TodayReport;
