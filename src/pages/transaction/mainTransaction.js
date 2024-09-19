import React, { useEffect, useState } from "react";
import TableData from "../../component/transaction/table";
import MUIDataTable from "mui-datatables";
import "../../styles/card.css";
import { Paper, TablePagination, Button } from "@mui/material";
import { IoAddCircleOutline } from "react-icons/io5";
import { FaLuggageCart } from "react-icons/fa";
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
  where,
} from "firebase/firestore";
import { db } from "../../config/database";
import Swal from "sweetalert2";
import dayjs from "dayjs";
import { MdDelete } from "react-icons/md";
import { IoEyeSharp } from "react-icons/io5";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../component/features/loader";
import LoaderTable from "../../component/features/loader2";
function MainTransaction() {
  const [isEdit, setIsEdit] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBarang, setSelectedBarang] = useState(null);
  const [jumlahBarang, setJumlahBarang] = useState(0);
  const [jenisTransaksi, setJenisTransaksi] = useState(null);
  const [harga, setHarga] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [jenisPembayaran, setJenisPembayaran] = useState(null);
  const [indexDetail, setIndexDetail] = useState(0);
  const [dataBarang, setDataBarang] = useState([]);
  const [dataTransaction, setDataTransaction] = useState([]);
  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [bayar, setBayar] = useState(0);
  const [jenis, setJenis] = useState("");
  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const [totalNominal, setTotalNominal] = useState(0);
  const [totalNominalTunai, setTotalNominalTunai] = useState(0);
  const [totalNominalNonTunai, setTotalNominalNonTunai] = useState(0);
  const [itemTerlaris, setitemTerlaris] = useState({});
  const [isLoad, setIsLoad] = useState(false);
  const [isData, setIsData] = useState(true);
  const cabang = sessionStorage.getItem("cabang");
  const peran = sessionStorage.getItem("peran");

  useEffect(() => {
    fetchItems();
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
        setIsData(false);

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

      console.log(`transactions${cabang}`, transactions);
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
            unit: transaction.item.unit, // Tambahkan unit item
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

      // Temukan item dengan jumlah transaksi terbanyak dan total quantity terbanyak
      const mostFrequentItem = Object.values(groupedByItem).reduce(
        (prev, current) => {
          const transaksiLebihBanyak =
            current.jumlahTransaksi > prev.jumlahTransaksi;
          const quantityLebihBanyak = current.totalBarang > prev.totalBarang;

          // Jika current memiliki transaksi lebih banyak, atau jika transaksi sama dan quantity lebih banyak
          if (
            transaksiLebihBanyak ||
            (current.jumlahTransaksi === prev.jumlahTransaksi &&
              quantityLebihBanyak)
          ) {
            return current;
          } else {
            return prev;
          }
        }
      );

      console.log("Most Frequent Item:", mostFrequentItem);
      setitemTerlaris(mostFrequentItem);
      setIsData(false);
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

  const fetchItems = async () => {
    try {
      // Fetch items collection
      const querySnapshot = await getDocs(collection(db, "items"));
      const categoriesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter items that are not checked
      const dataItem = categoriesArray.filter((a) => !a.isCheck);

      // Fetch categories for each item
      const dataOptionPromises = dataItem.map(async (a) => {
        // Fetch the category document using the reference
        const categoryDoc = await getDoc(a.itemCategory);

        // Combine item data with its category data
        return {
          value: a.id,
          text: a.itemName,
          refCategory: categoryDoc.id,
          categoryName: categoryDoc.data().nameCategory,
          price: a.sellPrice,
        };
      });

      // Wait for all promises to resolve
      const dataOption = await Promise.all(dataOptionPromises);

      console.log(dataOption, "opti");
      setDataBarang(dataOption);
    } catch (error) {
      console.error("Error fetching categories: ", error);
    }
  };
  const getInventory = async (itemRef) => {
    try {
      // Ambil referensi item yang diinginkan dari state

      // Buat query dengan filter where refItem == itemRef
      const inventoryQuery = query(
        collection(db, `inventorys${cabang}`),
        where("refItem", "==", itemRef)
      );

      const querySnapshot = await getDocs(inventoryQuery);
      const items = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        })
      );
      return items[0];
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    // setIsLoad(true);
    if (jenis == "E-Money") {
      // Cek jika state kosong
      if (
        selectedBarang == null ||
        jenisTransaksi == null ||
        jenisPembayaran == null ||
        bayar == 0 ||
        adminFee == 0
      ) {
        let missingFields = [];

        if (selectedBarang == null) missingFields.push("Barang");
        if (jenisPembayaran == null) missingFields.push("Jenis Pembayaran");
        if (jenisTransaksi == null) missingFields.push("Jenis Transaksi");
        if (bayar == null) missingFields.push("Jumlah Bayar");
        if (adminFee == null) missingFields.push("Jumlah Biaya Admin");
        setIsLoad(false);
        Swal.fire(
          "Error",
          `${missingFields.join(" dan ")} tidak boleh kosong`,
          "error"
        );

        return;
      }
    } else {
      if (
        selectedBarang == null ||
        jumlahBarang <= 0 ||
        jenisPembayaran == null
      ) {
        let missingFields = [];

        if (selectedBarang == null) missingFields.push("Barang");
        if (jumlahBarang <= 0) missingFields.push("Jumlah Barang");
        if (jenisPembayaran == null) missingFields.push("Jenis Pembayaran");
        setIsLoad(false);
        Swal.fire(
          "Error",
          `${missingFields.join(" dan ")} tidak boleh kosong`,
          "error"
        );

        return;
      }
    }

    try {
      await runTransaction(db, async (transaction) => {
        const itemRef = doc(db, "items", selectedBarang.value);
        let dataItems = null;
        let newStock = 0;
        if (jenis !== "E-Money") {
          dataItems = await getInventory(itemRef);
          console.log(dataItems, "data Items Invent");
          // Jika data inventory tidak ditemukan
          if (!dataItems) {
            Swal.fire(
              "Gagal",
              "Stok Barang " +
                selectedBarang.text +
                " Tidak Ada, Tambahkan Stok Dulu",
              "warning"
            );
            return [];
          }

          // Cek apakah stok mencukupi
          newStock = parseInt(dataItems.stock) - parseInt(jumlahBarang);
          if (newStock < 0) {
            throw new Error("Stock tidak mencukupi.");
          }
        }
        const categoryRef = doc(db, "category", selectedBarang.refCategory);
        let dataSend = {};
        const jam = dayjs().format("HH:mm");

        if (jenis == "E-Money") {
          dataSend = {
            refItem: itemRef,
            refCategory: categoryRef,
            quantity: parseInt(1),
            price: parseInt(bayar),
            payment:
              jenisTransaksi.text == "Topup"
                ? "Admin Dalam"
                : jenisPembayaran.value,
            adminFee: parseInt(adminFee),
            type: jenisTransaksi.value,
            date: tanggal,
            month: bulan,
            time: jam,
            year: tahun,
            isCheck: false,
          };
        } else {
          dataSend = {
            refItem: itemRef,
            refCategory: categoryRef,
            quantity: parseInt(jumlahBarang),
            price: parseInt(harga),
            payment: jenisPembayaran.value,
            date: tanggal,
            time: jam,
            month: bulan,
            year: tahun,
            isCheck: false,
          };
        }
        // Tambahkan data ke koleksi transactions
        await transaction.set(
          doc(collection(db, `transactions${cabang}`)),
          dataSend
        );

        // Data yang akan ditambahkan ke historyInventory
        const dateInput = dayjs().format("DD/MM/YYYY");
        const timeInput = dayjs().format("HH:mm");
        const monthInput = dayjs().format("MMMM");
        const yearInput = dayjs().format("YYYY");

        const historyData = {
          refItem: itemRef,
          refCategory: categoryRef,
          stock: parseInt(jumlahBarang),
          dateUpdate: tanggal,
          info: `Penjualan ${
            selectedBarang.text
          } Sejumlah ${jumlahBarang} dengan Total Harga ${formatRupiah(
            parseInt(jumlahBarang) * parseInt(harga)
          )}`,
          dateInput: dateInput,
          timeInput: timeInput,
          month: monthInput,
          year: yearInput,
          status: "Stok Keluar",
        };

        if (jenis != "E-Money") {
          // Tambahkan data ke historyInventory
          await transaction.set(
            doc(collection(db, `historyInventory${cabang}`)),
            historyData
          );

          // Update stok di inventory
          transaction.update(doc(db, `inventorys${cabang}`, dataItems.id), {
            stock: newStock,
            dateUpdate: tanggal,
          });
        }
        console.log(dataItems);
        Swal.fire("Success", "Transaction added successfully", "success");

        setJenisPembayaran(null);
        setRefresh(false);
        setSelectedBarang(null);
        setJenisPembayaran(null);
        setJenisTransaksi(null);
        setBayar(0);
        setHarga(0);
        setAdminFee(0);
        setJumlahBarang(0);
        setIsLoad(false);
        setJenis("");
        getTransactions();

        setIsOpen(false);
      });
    } catch (error) {
      setIsLoad(false);
      if (error.message === "Stock tidak mencukupi.") {
        Swal.fire("Error", "Stock tidak mencukupi", "error");
      } else {
        console.error("Error adding transaction: ", error);
        Swal.fire("Error", "Failed to add transaction", "error");
      }
    }
  };

  const handleDelete = async (data) => {
    const nama = sessionStorage.getItem("nama");

    const confirmDelete = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Anda yakin ingin menghapus Transaksi ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (confirmDelete.isConfirmed) {
      // setIsLoad(true);
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
            info: `Penghapusan Data Transaksi ${data.item.itemName} Sejumlah ${
              data.quantity
            } dengan Total Harga ${formatRupiah(
              parseInt(data.quantity) * parseInt(data.price)
            )} Oleh ${nama}`,
            dateInput: dateInput,
            timeInput: timeInput,
            month: monthInput,
            year: yearInput,
            status: "Stok Masuk",
          };

          if (jenis != "E-Money") {
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
      label: "Barang",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button
              onClick={() => {
                handleDetailData(tableMeta.rowIndex);
              }}
              className="flex justify-start items-center gap-2 w-full"
            >
              {value.category.nameCategory == "E-Money"
                ? value.item.itemName == "Dana"
                  ? value.type
                  : `${value.type}, ${value.item.itemName}`
                : value.item.itemName}
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
      label: "Harga Satuan",
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
            </div>
          );
        },
      },
    },
  ];
  const columns2 = [
    {
      name: "data",
      label: "Waktu",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button
              onClick={() => {
                handleDetailData(tableMeta.rowIndex);
              }}
              className="flex justify-start items-center gap-2 w-full"
            >
              {value.time} WIB
            </button>
          );
        },
      },
    },
    {
      name: "data",
      label: "Barang",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button
              onClick={() => {
                handleDetailData(tableMeta.rowIndex);
              }}
              className="flex justify-start items-center gap-2 w-full"
            >
              {value.type} {value.item.itemName}
            </button>
          );
        },
      },
    },
    {
      name: "harga",
      label: "Harga Satuan",
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
  ];
  const data = dataTransaction.map((a) => {
    return {
      itemName: a.item.itemName,
      jumlah: a.quantity,
      harga: a.price,
      data: a,
    };
  });

  const optionPembayaran = [
    { text: "Tunai", value: "Tunai" },
    { text: "QRIS", value: "QRIS" },
    { text: "Transfer", value: "Transfer" },
  ];
  const optionPembayaranEMoney = [
    { text: "Admin Dalam", value: "Admin Dalam" },
    { text: "Admin Luar", value: "Admin Luar" },
  ];

  const jenisTrans = [
    { text: "Topup", value: "Topup" },
    { text: "Tarik Dana", value: "Tarik Dana" },
  ];

  const getObject = (arr, item) => {
    return arr.find((x) => x.value === item);
  };
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
            <div className="w-full h-full flex flex-col justify-start items-center pb-28">
              <div
                data-aos="slide-down"
                data-aos-delay="50"
                className="w-full flex justify-center items-center   bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
              >
                <h3 className="text-white text-base font-normal">
                  Transaksi Hari Ini
                </h3>
              </div>
              <div className="w-full flex justify-start gap-10 items-center mt-10 h-full">
                <div
                  data-aos="slide-down"
                  data-aos-delay="50"
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
                  data-aos-delay="250"
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
              <div className="w-full flex justify-between items-center  p-2 rounded-md mt-5 gap-4">
                <div
                  data-aos="fade-up"
                  data-aos-delay="350"
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
                  data-aos-delay="350"
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
                  data-aos-delay="450"
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
                    <h3 className="text-xs font-medium">
                      {itemTerlaris.itemName}
                    </h3>
                  </div>
                </div>
              </div>

              <div
                data-aos="fade-up"
                data-aos-delay="550"
                className="w-full flex justify-end items-center  p-2 rounded-md mt-5"
              >
                <div>
                  <button
                    onClick={() => {
                      if (isDetail) {
                        setIsDetail(false);
                      }
                      setIsOpen(!isOpen);
                    }}
                    type="button"
                    class="bg-blue-500 text-center w-48 rounded-2xl h-10 relative  text-black text-xl font-semibold group"
                  >
                    <div class="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                      <IoAddCircleOutline className="text-[25px] text-blue-700 hover:text-blue-700" />
                    </div>
                    <p class="translate-x-2 text-xs text-white">Tambah Data</p>
                  </button>
                </div>
              </div>
              {/* <div
            className={`w-full ${
              !isDetail ? "h-0 p-0" : "h-[auto]  p-6 mt-3  "
            } duration-500 flex-col justify-start items-start rounded-md bg-white shadow-md `}
          >
            <div
              className={`w-full  ${
                !isDetail ? "hidden" : "flex flex-col "
              } justify-start items-start gap-4`}
            >
              <h5 className="text-base font-medium ">Nama Barang</h5>
              <p className="text-xs font-normal ">{dataDetail.item.itemName}</p>
              <h5 className="text-base font-medium ">Kategori Barang</h5>
              <p className="text-xs font-normal ">
                {dataDetail.category.nameCategory}
              </p>
              <h5 className="text-base font-medium ">Harga Beli Barang</h5>
              <p className="text-xs font-normal ">
                {formatRupiah(dataDetail.item.buyPrice)}
              </p>
              <h5 className="text-base font-medium ">Harga Jual Barang</h5>
              <p className="text-xs font-normal ">
                {formatRupiah(dataDetail.item.sellPrice)}
              </p>

              <div className="flex justify-start gap-6 items-center w-full pl-6">
                <div className="text-xs font-normal w-[15%]">Stok Saat Ini</div>
                <p className="text-xs font-normal ">: 5 Buah</p>
              </div>
              <div className="flex justify-start gap-6 items-center w-full pl-6">
                <div className="text-xs font-normal w-[15%]">Stok Minimum</div>
                <p className="text-xs font-normal ">: 5 Buah</p>
              </div>
              <div className="flex justify-start gap-6 items-center w-full pl-6">
                <div className="text-xs font-normal w-[15%]">Stok Maksimum</div>
                <p className="text-xs font-normal ">: 5 Buah</p>
              </div>
            </div>
          </div> */}

              <div
                className={`w-full ${
                  !isOpen
                    ? "h-0 p-0"
                    : jenis == "E-Money"
                    ? "h-[15rem] p-2 mt-3"
                    : "h-[11rem] p-2 mt-3"
                } duration-500 flex-col justify-start items-start rounded-md bg-white shadow-md`}
              >
                <div
                  className={`w-full ${
                    !isOpen ? "hidden" : "flex"
                  } justify-start items-center gap-4`}
                >
                  <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                    <h4 className="font-medium text-xs">
                      Pilih Barang {jenis}
                    </h4>
                    <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                      <DropdownSearch
                        change={(data) => {
                          setSelectedBarang(data);
                          setHarga(data.price);
                          setJenis(data.categoryName);
                          setRefresh(true);
                        }}
                        options={dataBarang}
                        refresh={refresh}
                        value={selectedBarang}
                        name={"Pilih Barang"}
                      />
                    </div>
                  </div>

                  {jenis == "E-Money" ? (
                    <>
                      {/* <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Nominal</h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={harga}
                          onChange={(e) => {
                            setHarga(e.target.value);
                          }}
                        />
                      </div> */}
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Bayar</h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={bayar}
                          onChange={(e) => {
                            setBayar(e.target.value);
                          }}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Nominal</h4>
                        <input
                          type="text"
                          readOnly
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={formatRupiah(harga)}
                          onChange={(e) => {
                            setHarga(e.target.value);
                          }}
                        />
                      </div>
                      <div className="w-[20%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Jumlah Barang</h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={jumlahBarang}
                          onChange={(e) => {
                            setJumlahBarang(e.target.value);
                          }}
                        />
                      </div>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">
                          Jenis Pembayaran
                        </h4>
                        <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                          <DropdownSearch
                            change={(data) => {
                              setJenisPembayaran(data);
                              setRefresh(true);
                            }}
                            options={optionPembayaran}
                            refresh={refresh}
                            value={jenisPembayaran}
                            name={"Pembayaran"}
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {jenis == "E-Money" && (
                  <>
                    <div
                      className={`w-full ${
                        !isOpen ? "hidden" : "flex"
                      } justify-start items-end gap-4 mt-3 pl-2`}
                    >
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Biaya Admin</h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={adminFee}
                          onChange={(e) => {
                            setAdminFee(e.target.value);
                          }}
                        />
                      </div>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Jenis Transaksi</h4>
                        <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                          <DropdownSearch
                            change={(data) => {
                              setRefresh(true);
                              setJenisTransaksi(data);
                              if (data.text == "Topup") {
                                setJenisPembayaran(
                                  getObject(
                                    optionPembayaranEMoney,
                                    "Admin Dalam"
                                  )
                                );
                              }
                            }}
                            options={jenisTrans}
                            value={jenisTransaksi}
                            refresh={refresh}
                            name={"Transaksi"}
                          />
                        </div>
                      </div>
                      {jenisTransaksi && (
                        <>
                          {jenisTransaksi.text == "Topup" ? (
                            <></>
                          ) : (
                            <>
                              <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                                <h4 className="font-medium text-xs">
                                  Jenis Pembayaran
                                </h4>
                                <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                                  <DropdownSearch
                                    change={(data) => {
                                      setRefresh(true);
                                      setJenisPembayaran(data);
                                    }}
                                    options={optionPembayaranEMoney}
                                    value={jenisPembayaran}
                                    refresh={refresh}
                                    name={"Pembayaran"}
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </>
                )}
                <div
                  className={`w-full ${
                    !isOpen ? "hidden" : "flex"
                  } justify-start items-end gap-4 mt-3 pl-2`}
                >
                  <button
                    type="button"
                    className="bg-blue-500 text-center mb-2 w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                    onClick={handleSubmit}
                  >
                    <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                      <FaRegSave className="text-[20px] text-blue-700 hover:text-blue-700" />
                    </div>
                    <p className="translate-x-2 text-xs text-white">
                      Simpan Data
                    </p>
                  </button>
                </div>
              </div>
              <div
                data-aos="fade-up"
                className="w-full flex justify-center  items-center mt-5 h-full mb-28"
              >
                {isData ? (
                  <>
                    <LoaderTable />
                  </>
                ) : (
                  <>
                    {peran == "Super Admin" ? (
                      <>
                        <Paper style={{ height: 400, width: "100%" }}>
                          <MUIDataTable
                            columns={columns}
                            data={data}
                            options={{
                              fontSize: 12, // adjust font size here
                            }}
                          />
                        </Paper>
                      </>
                    ) : (
                      <>
                        <Paper style={{ height: 400, width: "100%" }}>
                          <MUIDataTable
                            columns={columns2}
                            data={data}
                            options={{
                              fontSize: 12, // adjust font size here
                            }}
                          />
                        </Paper>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MainTransaction;
