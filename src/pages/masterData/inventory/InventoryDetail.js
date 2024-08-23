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
import { FaArrowTrendDown } from "react-icons/fa6";
import { MdDelete } from "react-icons/md";

import withRouter from "../../../component/features/withRouter";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  where,
} from "firebase/firestore";
import { db } from "../../../config/database";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { IoEyeSharp } from "react-icons/io5";
import { AnimatePresence, motion } from "framer-motion";
import { BiArchive } from "react-icons/bi";
import AOS from "aos";
import "aos/dist/aos.css";
import LoaderTable from "../../../component/features/loader2";
import DropdownSearch from "../../../component/features/dropdown";
import { TabBar } from "../../../component/features/tabBar";
function InventoryDetail({ params }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCheck, setIsCheck] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [indexDetail, setIndexDetail] = useState(0);
  const [form, setForm] = useState("");
  const { id } = params;
  const idCategory = params.id;
  const [totalItemMin, setTotalItemMin] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [additionalForms, setAdditionalForms] = useState([]);
  const [dataStok, setDataStok] = useState([]);
  const [dataCheck, setDataCheck] = useState([]);
  const [isData, setIsData] = useState(true);
  const [barang, setBarang] = useState(null);
  const [stok, setStok] = useState(0);
  const [activeTabIndex, setActiveTabIndex] = useState("tab1");
  const [indexTab, setIndexTab] = useState(0);
  const nama = sessionStorage.getItem("nama");
  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const allTabs = [
    {
      id: "tab1",
      name: "Stok Barang System",
    },
    {
      id: "tab2",
      name: "Selisih Stok",
    },
  ];
  const handleTabChange = (index) => {
    setActiveTabIndex(`tab${index + 1}`);
  };
  useEffect(() => {
    getInventory();
  }, []);

  const getInventory = async () => {
    try {
      // Definisikan ID kategori yang ingin dicari
      // Buat query untuk mengambil data inventory berdasarkan refCategory
      const inventoryQuery = query(
        collection(db, "inventorys"),
        where("refCategory", "==", doc(db, "category", idCategory)) // Menggunakan referensi kategori
      );

      const querySnapshot = await getDocs(inventoryQuery);
      const items = await Promise.all(
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

          return {
            id: doc.id,
            ...data,
            item: itemData,
            category: categoryData,
            categoryName: categoryData.nameCategory,
            itemId: itemRef.id,
            categoryId: categoryRef.id,
          };
        })
      );

      // Menghitung total stock
      const totalStock = items.reduce((total, item) => total + item.stock, 0);

      // Menghitung jumlah objek yang stok-nya lebih kecil dari minStock
      const countBelowMinStock = items.filter(
        (item) => item.stock < item.item.minStock
      ).length;

      setTotalStok(totalStock);
      setTotalItemMin(countBelowMinStock);
      console.log("Items", items);
      console.log("Total Stock:", totalStock);
      console.log(
        "Jumlah Objek dengan Stock di Bawah MinStock:",
        countBelowMinStock
      );
      setIsData(false);

      // Simpan data yang diambil ke state
      setDataStok(items);
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
  const handleCheck = async () => {
    setIsCheck(true);

    const result = [];

    for (const item1 of additionalForms) {
      const matchedItem = dataStok.find(
        (item2) => item2.itemId === item1.barang.idItem
      );

      if (matchedItem) {
        const selisih = Math.abs(
          parseInt(item1.stok) - parseInt(matchedItem.stock)
        );
        let status = "";

        if (parseInt(item1.stok) < parseInt(matchedItem.stock)) {
          status = "Kurang";
        } else if (parseInt(item1.stok) > parseInt(matchedItem.stock)) {
          status = "Lebih";
        } else {
          status = "Sama";
        }

        if (status == "Kurang") {
          await handleKurang(selisih, matchedItem);
        } else if (status == "Lebih") {
          await handleLebih(selisih, matchedItem);
        }

        result.push({
          item: item1.barang.text,
          stokReal: item1.stok,
          stokSys: matchedItem.stock,
          status: status,
          selisih: selisih,
          unit: matchedItem.unit,
          data: {
            item: item1.barang.text,
            stokReal: item1.stok,
            stokSys: matchedItem.stock,
            status: status,
            selisih: selisih,
            unit: matchedItem.unit,
          },
        });
      }
    }

    // Menghitung total stock
    const totalStock = result.reduce(
      (total, item) => total + parseInt(item.stokReal),
      0
    );
    if (parseInt(totalStock) < parseInt(totalStok)) {
      await handleHistory(totalStock, "Kurang");
    } else if (parseInt(totalStock) > parseInt(totalStok)) {
      await handleHistory(totalStock, "Lebih");
    }
    setActiveTabIndex("tab2");
    setDataCheck(result);
    setIndexTab(1);
    return result;
  };

  const handleKurang = async (gap, item) => {
    try {
      await runTransaction(db, async (transaction) => {
        // Referensi untuk item dan kategori
        const itemRef = doc(db, "items", "GBwAvYWhBOpnvkUBDCV6");
        const itemRef2 = doc(db, "items", item.itemId);
        const categoryRef = doc(db, "category", "M16tNTY5RQG6zfM4tVv5");
        const categoryRef2 = doc(db, "category", item.categoryId);

        // Hitung harga berdasarkan gap dan harga jual item
        const price = parseInt(gap) * parseInt(item.item.sellPrice);

        // Tambahkan data ke koleksi transactions (Piutang)
        transaction.set(doc(collection(db, "transactions")), {
          refItem: itemRef,
          refCategory: categoryRef,
          quantity: parseInt(1),
          price: parseInt(price),
          payment: "Piutang",
          info: `Kekurangan Stok ${item.item.itemName}`,
          date: tanggal,
          month: bulan,
          year: tahun,
          type: "Stock",
          isCheck: false,
          isBayar: false,
          user: nama,
        });

        // Tambahkan data ke koleksi transactions (Transfer)
        transaction.set(doc(collection(db, "transactions")), {
          refItem: itemRef2,
          refCategory: categoryRef2,
          quantity: parseInt(gap),
          price: parseInt(item.item.sellPrice),
          payment: "Transfer",
          date: tanggal,
          month: bulan,
          year: tahun,
          isCheck: false,
        });

        // Data yang akan ditambahkan ke historyInventory
        const dateInput = dayjs().format("DD/MM/YYYY");
        const timeInput = dayjs().format("HH:mm");
        const monthInput = dayjs().format("MMMM");
        const yearInput = dayjs().format("YYYY");
        const newStock = parseInt(item.stock) - parseInt(gap);

        const historyData = {
          refItem: itemRef2,
          refCategory: categoryRef2,
          stock: parseInt(gap),
          dateUpdate: tanggal,
          info: `Penjualan ${
            item.itemName
          } Sejumlah ${gap} dengan Total Harga ${formatRupiah(
            parseInt(gap) * parseInt(item.item.sellPrice)
          )}`,
          dateInput: dateInput,
          timeInput: timeInput,
          month: monthInput,
          year: yearInput,
          status: "Stok Keluar",
        };

        // Tambahkan data ke historyInventory
        transaction.set(doc(collection(db, "historyInventory")), historyData);

        // Update stok di inventory
        transaction.update(doc(db, "inventorys", item.id), {
          stock: newStock,
          dateUpdate: tanggal,
        });
      });

      console.log("berhasil");
    } catch (error) {
      console.error("Error adding Transactions: ", error);
      Swal.fire("Error", "Failed to add Transactions", "error");
    }
  };

  const handleLebih = async (gap, item) => {
    try {
      await runTransaction(db, async (transaction) => {
        // Referensi untuk item dan kategori
        const itemRef = doc(db, "items", "GBwAvYWhBOpnvkUBDCV6");
        const itemRef2 = doc(db, "items", item.itemId);
        const categoryRef = doc(db, "category", "M16tNTY5RQG6zfM4tVv5");
        const categoryRef2 = doc(db, "category", item.categoryId);

        // Hitung harga berdasarkan gap dan harga jual item
        const price = parseInt(gap) * parseInt(item.item.sellPrice);

        // Data yang akan ditambahkan ke historyInventory
        const dateInput = dayjs().format("DD/MM/YYYY");
        const timeInput = dayjs().format("HH:mm");
        const monthInput = dayjs().format("MMMM");
        const yearInput = dayjs().format("YYYY");
        const newStock = parseInt(item.stock) + parseInt(gap);

        const historyData = {
          refItem: itemRef2,
          refCategory: categoryRef2,
          stock: parseInt(gap),
          dateUpdate: tanggal,
          info: `Selisih Lebih Stok ${item.itemName} Sejumlah ${gap}`,
          dateInput: dateInput,
          timeInput: timeInput,
          month: monthInput,
          year: yearInput,
          status: "Stok Masuk",
        };

        // Tambahkan data ke historyInventory
        transaction.set(doc(collection(db, "historyInventory")), historyData);

        // Update stok di inventory
        transaction.update(doc(db, "inventorys", item.id), {
          stock: newStock,
          dateUpdate: tanggal,
        });
      });

      console.log("berhasil");
    } catch (error) {
      console.error("Error adding Transactions: ", error);
      Swal.fire("Error", "Failed to add Transactions", "error");
    }
  };
  const handleHistory = async (stok, info) => {
    try {
      const gap = Math.abs(parseInt(totalStok) - parseInt(stok));
      const timeInput = dayjs().format("HH:mm");
      await addDoc(collection(db, "historyCheck"), {
        totalSystemStock: parseInt(totalStok),
        totalGap: parseInt(gap),
        totalActuallyStock: parseInt(stok),
        totalTransaction: parseInt(dataStok.length),
        dateCheck: tanggal,
        type: "Stock",
        info,
        user: nama,
        timeCheck: timeInput,
      });
      console.log("berhasil");
    } catch (error) {
      console.error("Error adding category: ", error);
      Swal.fire("Error", "Failed to add category", "error");
    }
  };
  const addNewForm = () => {
    if (barang == null) {
      Swal.fire({
        title: "Error!",
        text: "Pilih Barang Terlebih Dahulu ",
        icon: "error",
        confirmButtonText: "OK",
      });
    } else {
      setAdditionalForms([
        ...additionalForms,
        {
          barang: barang,
          stok: parseInt(stok),
        },
      ]);

      setStok(0);
      setBarang(null);
    }
  };
  const removeForm = (item) => {
    const newForms = additionalForms.filter(
      (i) => i.barang.value != item.barang.value
    );
    setAdditionalForms(newForms);
  };
  const formatTanggal = (value) => {
    const formattedDate = dayjs(value, "DD/MM/YYYY").format("D MMMM YYYY");
    return formattedDate;
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
      name: "item",
      label: "Nama",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          return (
            <button
              onClick={() => {
                handleDetailData(tableMeta.rowIndex);
              }}
              className="flex justify-start items-center gap-2 w-full"
            >
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "data",
      label: "Stok",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div
              className={`flex justify-start items-center gap-2 w-full ${
                value.stok <= value.minStok // Menggunakan index yang sesuai untuk minStok
                  ? "bg-red-200 border border-red-700 rounded-xl p-2"
                  : ""
              }`}
            >
              {value.stok} {value.unit}
            </div>
          );
        },
      },
    },
    {
      name: "dateUpdate",
      label: "Update",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          const formattedDate = dayjs(value, "DD/MM/YYYY").format(
            "D MMMM YYYY"
          );
          return formattedDate; // Kembalikan tanggal dalam format yang diinginkan
        },
      },
    },
    {
      name: "dateExp",
      label: "Expired",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          // Mengonversi tanggal dari format DD/MM/YYYY ke format yang diinginkan
          const formattedDate = dayjs(value, "DD/MM/YYYY").format(
            "D MMMM YYYY"
          );
          return formattedDate; // Kembalikan tanggal dalam format yang diinginkan
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
                onClick={(data) => handleDetailData(value)}
              >
                <span className="svgContainer">
                  <IoEyeSharp className="text-xl " />
                </span>
                <span className="BG bg-blue-600"></span>
              </button>
            </div>
          );
        },
      },
    },
  ];
  const columnsCheck = [
    {
      name: "item",
      label: "Nama",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          return (
            <button
              onClick={() => {
                handleDetailData(tableMeta.rowIndex);
              }}
              className="flex justify-start items-center gap-2 w-full"
            >
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "data",
      label: "Stok Fisik",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div className={`flex justify-start items-center gap-2 w-full `}>
              {value.stokReal} {value.unit}
            </div>
          );
        },
      },
    },
    {
      name: "data",
      label: "Stok Sistem",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div className={`flex justify-start items-center gap-2 w-full `}>
              {value.stokSys} {value.unit}
            </div>
          );
        },
      },
    },
    {
      name: "data",
      label: "Selisih",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return (
            <div
              className={`flex justify-start items-center gap-2 w-full rounded-md font-medium p-2 ${
                value.status == "Kurang"
                  ? "bg-red-100 text-red-600 border border-red-600"
                  : "bg-teal-100 text-teal-600 border border-teal-600"
              } `}
            >
              {value.status} {value.selisih} {value.unit}
            </div>
          );
        },
      },
    },
  ];

  // Mengambil data dari state dan memetakan ke format yang diinginkan
  const data = dataStok.map((a) => {
    return {
      id: a.id,
      item: a.item.itemName, // Pastikan itemName ada dalam data item
      minStok: a.item.minStock,
      maxStok: a.item.maxStock,
      stok: a.stock,
      dateUpdate: a.dateUpdate,
      dateExp: a.dateExp,
      unit: a.unit, // Pastikan info ada dalam data
      data: {
        id: a.id,
        item: a.item.itemName, // Pastikan itemName ada dalam data item
        minStok: a.item.minStock,
        maxStok: a.item.maxStock,
        dateExp: a.dateExp,
        unit: a.unit, // Pastikan info ada dalam data
        stok: a.stock,
        dateUpdate: a.dateUpdate,
        info: a.info, // Pastikan info ada dalam data
      }, // Menyimpan objek data lengkap jika diperlukan
    };
  });
  const dataOption = dataStok.map((a) => {
    return {
      value: a.id,
      text: a.item.itemName,
      idItem: a.itemId,
    };
  });
  console.log(dataDetail, "Detail data");
  return (
    <div>
      <div className="w-full h-full flex flex-col justify-start items-center pb-44">
        <div
          data-aos="slide-down"
          data-aos-delay="50"
          className="w-full flex justify-start items-center bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
        >
          <h3 className="text-white text-base font-normal">Stok Kategori</h3>
        </div>
        <div className="w-full flex justify-start gap-5 items-center mt-10 h-full">
          <div
            data-aos="fade-up"
            data-aos-delay="250"
            className="cookieCard w-[40%] p-6"
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
            data-aos-delay="350"
            className="w-[33%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
          >
            <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
              <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                <div className="w-full flex justify-start gap-4 items-center">
                  <h3 className="text-xl font-medium">{totalItemMin} Barang</h3>
                </div>
                <div className="w-full flex justify-start gap-4 items-center">
                  <h3 className="text-xs font-normal">
                    Jumlah Barang Dengan Stok Menipis
                  </h3>
                </div>
              </div>
              <div className="w-[20%] flex flex-col justify-start gap-4 items-end">
                <div className=" w-[2.5rem] h-[2.5rem] bg-blue-100 rounded-full flex justify-center items-center p-3">
                  <BiArchive className="text-blue-600 text-[1rem]" />
                </div>
              </div>
            </div>
          </div>
          <div
            data-aos="fade-up"
            data-aos-delay="450"
            className="w-[33%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
          >
            <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
              <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                <div className="w-full flex justify-start gap-4 items-center">
                  <h3 className="text-xl font-medium">
                    {dataStok.length} Barang
                  </h3>
                </div>
                <div className="w-full flex justify-start gap-4 items-center">
                  <h3 className="text-xs font-normal">Total Semua Barang</h3>
                </div>
              </div>
              <div className="w-[20%] flex flex-col justify-start gap-4 items-end">
                <div className=" w-[2.5rem] h-[2.5rem] bg-blue-100 rounded-full flex justify-center items-center p-3">
                  <BiArchive className="text-blue-600 text-[1rem]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          data-aos="fade-up"
          data-aos-delay="550"
          className="bg-white shadow-md w-full p-6 rounded-xl flex justify-start items-center mt-5 mb-5 "
        >
          <h3 className="text-base text-blue-600 font-medium">
            {dataStok.length > 0 ? dataStok[0].categoryName : ""}
          </h3>
        </div>
        {isCheck == false && (
          <>
            <div
              data-aos="fade-up"
              data-aos-delay="400"
              className={`w-full ${
                isCheck ? "h-0 p-0" : "h-auto p-4  mt-3"
              } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md mb-5`}
            >
              <div
                className={`w-full ${
                  isCheck ? "hidden" : "flex"
                } justify-start items-center gap-4 w-full border-b p-2 border-b-blue-600`}
              >
                <h4 className="text-base font-medium">
                  Check Data Stok Barang
                </h4>
              </div>

              <div
                className={`w-full ${
                  isCheck ? "hidden" : "flex"
                } justify-start items-end gap-4 pl-8 pr-14 mt-5`}
              >
                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Pilih Barang</h4>
                  <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                    <DropdownSearch
                      change={(data) => {
                        setBarang(data);
                      }}
                      options={dataOption}
                      value={barang}
                      name={"Barang"}
                    />
                  </div>
                </div>

                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Jumlah Stok</h4>
                  <input
                    type="number"
                    value={stok}
                    onChange={(e) => {
                      setStok(e.target.value);
                    }}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
                <button
                  type="button"
                  onClick={addNewForm}
                  className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative mb-2 text-black text-xl font-semibold group"
                >
                  <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                    <PiShoppingCartBold className="text-[16px] text-blue-700 hover:text-blue-700" />
                  </div>
                  <p className="translate-x-2 text-[0.65rem] text-white">
                    Tambah Data
                  </p>
                </button>
              </div>

              {/* {addNewForm.length > 0 && (
                <> */}
              <div className="w-full mt-5 flex justify-center items-center px-6">
                <div className="w-[60%]  flex justify-between items-center p-2 rounded-md bg-blue-600 text-white text-xs font-medium">
                  <div className="w-[33%] flex justify-center items-center">
                    Barang
                  </div>
                  <div className="w-[33%] flex justify-center items-center">
                    Stok
                  </div>
                  <div className="w-[33%] flex justify-center items-center">
                    Aksi
                  </div>
                </div>
              </div>
              <div className="w-full flex justify-center items-center px-6">
                <div className="w-[60%] mt-2 shadow-md border border-blue-500 flex flex-col justify-center items-center rounded-md text-xs font-medium">
                  {additionalForms.map((form, index) => (
                    <>
                      <div className="w-full mt-2 flex justify-between items-center p-2 rounded-md  text-xs font-medium">
                        <div className="w-[45%] flex justify-center items-center">
                          {form.barang.text}
                        </div>
                        <div className="w-[45%] flex justify-center items-center">
                          {form.stok}
                        </div>
                        <div className="w-[45%] flex justify-center items-center">
                          <button
                            className="bg-red-500 flex justify-center items-center p-2 rounded-md text-white"
                            onClick={() => removeForm(form)}
                          >
                            <MdDelete className="text-xl " />
                          </button>
                        </div>
                      </div>
                    </>
                  ))}
                </div>
              </div>
              {/* </>
              )} */}
              <div
                className={`w-full ${
                  isCheck ? "hidden" : "flex"
                } justify-start items-center gap-4`}
              >
                <div className="text-xs flex flex-col justify-end items-start p-2 mb-2 gap-4 pt-8 ">
                  <button
                    type="button"
                    onClick={handleCheck}
                    className="bg-blue-500 text-center w-48 rounded-2xl h-10 mb-2 relative text-black text-xl font-semibold group"
                  >
                    <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                      <FaRegSave className="text-[16px] text-blue-700 hover:text-blue-700" />
                    </div>
                    <p className="translate-x-2 text-[0.65rem] text-white">
                      Check Data
                    </p>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
        {isCheck == true && (
          <>
            <div
              data-aos="fade-up"
              data-aos-delay="550"
              className="w-full flex justify-end gap-4 mt-5 items-center p-2 rounded-md"
            >
              <button
                onClick={() => {
                  if (isDetail) {
                    setIsDetail(false);
                  }
                  setIsOpen(!isOpen);
                  setIsCheck(false);
                }}
                type="button"
                className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xs font-medium group"
              >
                <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[95%] z-10 duration-500">
                  <IoAddCircleOutline className="text-[18px] text-blue-700 hover:text-blue-700" />
                </div>
                <p className="translate-x-2 text-[0.65rem] text-white">
                  Check Data
                </p>
              </button>
            </div>

            <TabBar
              data-aos="fade-up"
              data-aos-delay="450"
              data={allTabs}
              onTabChange={handleTabChange}
              index={indexTab}
            />
            <div
              className={`w-full ${
                !isDetail ? "h-0 p-0" : "h-auto p-6 mt-5"
              } duration-500 flex-col justify-start items-start rounded-md bg-white shadow-md`}
            >
              <div
                className={`w-full ${
                  !isDetail ? "hidden" : "flex flex-col"
                } justify-start items-start gap-4`}
              >
                <h5 className="text-xl font-medium text-blue-600">
                  Detail Info
                </h5>
                <h5 className="text-base font-medium">Barang</h5>
                <p className="text-xs font-normal">{dataDetail.item}</p>
                <h5 className="text-base font-medium">Jumlah Stok</h5>
                <p className="text-xs font-normal">
                  {dataDetail.stok} {dataDetail.unit}
                </p>
                <h5 className="text-base font-medium">Tanggal Update</h5>
                <p className="text-xs font-normal">
                  {formatTanggal(dataDetail.dateUpdate)}
                </p>
                <h5 className="text-base font-medium">Tanggal Expired</h5>
                <p className="text-xs font-normal">
                  {formatTanggal(dataDetail.dateExp)}
                </p>
              </div>
            </div>

            {activeTabIndex == "tab1" && (
              <>
                <div className="w-full flex justify-center items-center mt-5 h-full mb-28">
                  {isData ? (
                    <>
                      <LoaderTable />
                    </>
                  ) : (
                    <>
                      <Paper style={{ height: 400, width: "100%" }}>
                        <MUIDataTable
                          columns={columns}
                          data={data}
                          options={{
                            fontSize: 12,
                          }}
                        />
                      </Paper>
                    </>
                  )}
                </div>
              </>
            )}
            {activeTabIndex == "tab2" && (
              <>
                <div className="w-full flex justify-center items-center mt-5 h-full mb-28">
                  <Paper style={{ height: 400, width: "100%" }}>
                    <MUIDataTable
                      columns={columnsCheck}
                      data={dataCheck}
                      options={{
                        fontSize: 12,
                      }}
                    />
                  </Paper>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default withRouter(InventoryDetail);
