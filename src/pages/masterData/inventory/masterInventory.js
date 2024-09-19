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
import { TabBar } from "../../../component/features/tabBar";
import TableHistory from "../../../component/inventory/tableHistory";
import { Link } from "react-router-dom";
import DropdownSearch from "../../../component/features/dropdown";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  runTransaction,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../config/database";
import dayjs from "dayjs";
import "dayjs/locale/id";

import { DatePicker, Space } from "antd";
import Swal from "sweetalert2";
import { IoEyeSharp } from "react-icons/io5";
import { BiArchive } from "react-icons/bi";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../../component/features/loader";
import LoaderTable from "../../../component/features/loader2";
const dateFormatList = ["DD/MM/YYYY", "DD/MM/YY", "DD-MM-YYYY", "DD-MM-YY"];

function MasterInventory() {
  const [isOpen, setIsOpen] = useState(false);
  const [refresh, setRefresh] = useState(false);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [indexDetail, setIndexDetail] = useState(0);
  const [totalStok, setTotalStok] = useState(0);
  const [totalStokMasuk, setTotalStokMasuk] = useState(0);
  const [totalStokKeluar, setTotalStokKeluar] = useState(0);
  const [form, setForm] = useState("");
  const [barang, setBarang] = useState(null);
  const [dataItems, setDataItems] = useState([]);
  const [stok, setStok] = useState(0);
  const [tanggal, setTanggal] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [tanggalExp, setTanggalExp] = useState(
    dayjs().locale("id").format("DD/MM/YYYY")
  );
  const [bulan, setBulan] = useState(dayjs().format("MMMM"));
  const [tahun, setTahun] = useState(dayjs().format("YYYY"));
  const cabang = sessionStorage.getItem("cabang");

  const [keterangan, setKeterangan] = useState("");
  const [satuan, setSatuan] = useState("");
  const [additionalForms, setAdditionalForms] = useState([]);
  const [dataStok, setDataStok] = useState([]);
  const [dataHistory, setDataHistory] = useState([]);
  const [dataDisplay, setDataDisplay] = useState([]);
  const [isData1, setIsData1] = useState(true);
  const [isData2, setIsData2] = useState(true);
  const [isLoad, setIsLoad] = useState(false);
  const [activeTabIndex, setActiveTabIndex] = useState("tab1");

  const allTabs = [
    {
      id: "tab1",
      name: "Stok Barang",
    },
    {
      id: "tab2",
      name: "Riwayat Perubahan Stok",
    },
  ];
  const handleTabChange = (index) => {
    setActiveTabIndex(`tab${index + 1}`);
  };
  useEffect(() => {
    fetchItems();
    getInventory();
    getHistoryInventory(bulan, tahun);
  }, []);
  const fetchItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const categoriesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const dataOption = categoriesArray.map((a) => {
        return {
          value: a.id,
          text: a.itemName,
          refCategory: a.itemCategory.id,
        };
      });
      console.log(dataOption, "opti");
      setDataItems(dataOption);
    } catch (error) {
      console.error("Error fetching categories: ", error);
    }
  };

  const getInventory = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, `inventorys${cabang}`)
      );
      const items = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();

          // Cek apakah refItem dan refCategory ada
          if (!data.refItem || !data.refCategory) {
            console.warn("Missing refItem or refCategory in document:", doc.id);
            return null; // Atau return default value jika perlu
          }

          // Fetch data item berdasarkan refItem
          const itemRef = data.refItem;
          const itemDoc = await getDoc(itemRef);
          if (!itemDoc.exists()) {
            console.warn("Item document does not exist:", itemRef.id);
            return null;
          }
          const itemData = itemDoc.data();

          // Fetch data category berdasarkan refCategory
          const categoryRef = data.refCategory;
          const categoryDoc = await getDoc(categoryRef);
          if (!categoryDoc.exists()) {
            console.warn("Category document does not exist:", categoryRef.id);
            return null;
          }
          const categoryData = categoryDoc.data();

          return {
            id: doc.id,
            ...data,
            item: itemData,
            category: categoryData,
            itemId: itemRef.id,
            categoryId: categoryRef.id,
          };
        })
      );

      // Hapus nilai null dari items
      const filteredItems = items.filter((item) => item !== null);

      // Mengelompokkan data inventory berdasarkan kategori
      const groupedData = filteredItems.reduce((acc, item) => {
        const categoryId = item.categoryId;
        if (!acc[categoryId]) {
          acc[categoryId] = {
            categoryName: item.category.nameCategory,
            jumlahStok: 0,
            dateUpdate: "",
            idCategory: categoryId, // Menambahkan properti idCategory
          };
        }

        // Tambahkan stok
        acc[categoryId].jumlahStok += parseInt(item.stock);

        // Cek dan perbarui tanggal terakhir
        const currentDate = dayjs(item.dateUpdate, "DD/MM/YYYY");
        const lastDateUpdate = dayjs(acc[categoryId].dateUpdate, "DD/MM/YYYY");

        // Hanya perbarui jika currentDate lebih besar dari lastDateUpdate
        if (!lastDateUpdate.isValid() || currentDate.isAfter(lastDateUpdate)) {
          acc[categoryId].dateUpdate = currentDate.format("DD/MM/YYYY");
        }

        return acc;
      }, {});

      // Konversi hasil pengelompokan menjadi array
      const groupedArray = Object.values(groupedData);
      const totalStok = filteredItems.reduce((total, item) => {
        return total + (item.stock || 0);
      }, 0);

      setTotalStok(totalStok);
      console.log("Grouped Items", groupedArray);
      setDataStok(filteredItems);
      setDataDisplay(groupedArray);
      setIsData1(false);
    } catch (e) {
      Swal.fire({
        title: "Error!",
        text: "Gagal mendapatkan data inventory: " + e.message,
        icon: "error",
        confirmButtonText: "OK",
      });
      console.log(e);
      return [];
    }
  };

  const getHistoryInventory = async (month, year) => {
    setIsData2(true);
    try {
      // Ambil state bulan dan tahun
      console.log(month, "bulan");
      console.log(year, "tahun");
      // Ambil data historyInventory berdasarkan bulan dan tahun yang sesuai
      const querySnapshot = await getDocs(
        query(
          collection(db, `historyInventory${cabang}`),
          where("month", "==", month),
          where("year", "==", year)
        )
      );

      const items = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
          };
        })
      );

      // Mengelompokkan data berdasarkan dateInput
      const groupedData = items.reduce((acc, item) => {
        const dateInput = item.dateInput;
        if (!acc[dateInput]) {
          acc[dateInput] = {
            dateInput: dateInput,
            totalItem: 0,
            stockIn: 0,
            stockOut: 0,
            refItems: new Set(), // Menggunakan Set untuk menghitung jumlah refItem yang unik
          };
        }

        // Tambahkan jumlah stok sesuai status
        if (item.status === "Stok Masuk") {
          acc[dateInput].stockIn += parseInt(item.stock);
        } else if (item.status === "Stok Keluar") {
          acc[dateInput].stockOut += parseInt(item.stock);
        }

        // Tambahkan refItem ke Set untuk menghitung jumlah yang unik
        acc[dateInput].refItems.add(item.refItem.id); // Pastikan menggunakan id dari refItem

        return acc;
      }, {});

      // Mengonversi Set ke jumlah refItem dan membentuk array hasil akhir
      const finalResult = Object.values(groupedData).map((group) => {
        return {
          ...group,
          totalItem: group.refItems.size, // Menghitung jumlah refItem unik
        };
      });
      const totalStok = finalResult.reduce(
        (acc, item) => {
          acc.stokMasuk += parseInt(item.stockIn);
          acc.stokKeluar += parseInt(item.stockOut);
          return acc;
        },
        { stokMasuk: 0, stokKeluar: 0 }
      );

      setTotalStokKeluar(totalStok.stokKeluar);
      setTotalStokMasuk(totalStok.stokMasuk);
      console.log("Grouped History Items", finalResult);
      // Misalnya, Anda dapat menyimpan data ke dalam state
      setDataHistory(finalResult);
      setIsData2(false);
    } catch (e) {
      Swal.fire({
        title: "Error!",
        text: "Gagal mendapatkan data history: " + e.message,
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };

  const handleChangeDate = (name, date) => {
    const dayjsDate = dayjs(date);

    if (!dayjsDate.isValid()) {
      return;
    }
    if (name == "tanggalExp") {
      const formattedDate = dayjsDate.format("DD/MM/YYYY");
      setTanggalExp(formattedDate);
    } else {
      const formattedDate = dayjsDate.format("DD/MM/YYYY");
      setTanggal(formattedDate);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newForms = [...additionalForms];

    if (field === "tanggal") {
      const dayjsDate = dayjs(value);

      if (!dayjsDate.isValid()) {
        return;
      }

      newForms[index][field] = dayjsDate.format("DD/MM/YYYY");
    } else {
      newForms[index][field] = value;
    }

    setAdditionalForms(newForms);
  };

  const addNewForm = () => {
    setAdditionalForms([
      ...additionalForms,
      {
        barang: barang,
        stok: parseInt(stok),
        satuan: satuan,
        tanggalExp: tanggalExp || dayjs().locale("id").format("DD/MM/YYYY"),
        tanggal: tanggal || dayjs().locale("id").format("DD/MM/YYYY"),
        // keterangan: "",
      },
    ]);
    setTanggal(dayjs().locale("id").format("DD/MM/YYYY"));
    setTanggalExp(dayjs().locale("id").format("DD/MM/YYYY"));
    setStok(0);
    setSatuan("");
    setBarang(null);
  };
  const removeForm = (item) => {
    const newForms = additionalForms.filter(
      (i) => i.barang.value != item.barang.value
    );
    setAdditionalForms(newForms);
  };

  const handleAdd = async () => {
    // Cek jika state barang dan keterangan kosong
    setIsLoad(true);

    const dataGroup = additionalForms;
    console.log("data Send", dataGroup);

    // Cek properti pada setiap objek di dataGroup
    for (const data of dataGroup) {
      let incompleteFields = [];
      if (data.barang == null || data.barang.value === "") {
        incompleteFields.push("Barang");
      }
      if (data.satuan === "") {
        incompleteFields.push("Satuan");
      }
      if (data.stok === "") {
        Swal.fire("Error", "Stok tidak boleh kosong", "error");
        return;
      }

      // Set tanggal jika kosong
      if (data.tanggal === "") {
        data.tanggal = dayjs().locale("id").format("DD/MM/YYYY");
      }

      setIsLoad(false);

      if (incompleteFields.length > 0) {
        Swal.fire(
          "Error",
          `${incompleteFields.join(" dan ")} tidak boleh kosong`,
          "error"
        );
        return;
      }
    }

    try {
      // Menggunakan transaksi
      await runTransaction(db, async (transaction) => {
        for (const data of dataGroup) {
          const itemRef = doc(db, "items", data.barang.value);
          const categoryRef = doc(db, "category", data.barang.refCategory);
          const existingItem = dataStok.find(
            (item) =>
              item.itemId === data.barang.value &&
              item.categoryId === data.barang.refCategory
          );

          if (existingItem) {
            // Jika item sudah ada, lakukan update dengan menambahkan stok baru ke stok yang sudah ada
            const itemInventoryRef = doc(
              db,
              `inventorys${cabang}`,
              existingItem.id
            );
            const newStock = parseInt(existingItem.stock) + parseInt(data.stok);

            transaction.update(itemInventoryRef, {
              stock: newStock, // Update stok yang baru
              dateUpdate: data.tanggal,
              unit: data.satuan,
              dateExp: data.tanggalExp,

              // info: data.keterangan,
            });
          } else {
            // Jika item belum ada, lakukan insert baru
            const inventoryRef = doc(collection(db, `inventorys${cabang}`));
            transaction.set(inventoryRef, {
              refItem: itemRef,
              refCategory: categoryRef,
              unit: data.satuan,
              stock: parseInt(data.stok), // Pastikan stok sudah dalam tipe number
              dateUpdate: data.tanggal,
              dateExp: data.tanggalExp,
              // info: data.keterangan,
            });
          }

          // Tambahkan data ke historyInventory
          const dateInput = dayjs().format("DD/MM/YYYY");
          const timeInput = dayjs().format("HH:mm");
          const monthInput = dayjs().format("MMMM"); // Format bulan seperti "May"
          const yearInput = dayjs().format("YYYY"); // Format tahun

          const historyInventoryRef = doc(
            collection(db, `historyInventory${cabang}`)
          );
          transaction.set(historyInventoryRef, {
            refItem: itemRef,
            refCategory: categoryRef,
            stock: parseInt(data.stok), // Pastikan stok sudah dalam tipe number
            dateUpdate: data.tanggal,
            dateExp: data.tanggalExp,
            // info: data.keterangan,
            dateInput: dateInput,
            timeInput: timeInput,
            month: monthInput,
            year: yearInput,
            status: "Stok Masuk",
          });
        }
      });
      setIsLoad(false);
      setRefresh(false);
      setBarang({});
      setStok(0);
      setTanggal(dayjs().locale("id").format("DD/MM/YYYY"));
      setKeterangan("");
      setAdditionalForms([]);
      Swal.fire("Berhasil!", "Data berhasil ditambahkan", "success");
      getInventory();
      // Reset state atau lakukan tindakan lain setelah berhasil menambah data
      setIsOpen(false);
    } catch (e) {
      setIsLoad(false);

      Swal.fire(
        "Error!",
        "Gagal menambahkan data handleadd: " + e.message,
        "error"
      );
    }
  };

  const handleDetailData = (id) => {
    if (indexDetail === id && isDetail) {
      setIsDetail(false);
    } else {
      setIsDetail(true);
    }

    setIndexDetail(id);
    setIsOpen(false);
    const dataFilter = dataStok[id];
    setDataDetail(dataFilter);
  };

  const columns = [
    {
      name: "categoryName",
      label: "Nama Kategori",
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
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "jumlahStok",
      label: "Total Stok",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "dateUpdate",
      label: "Tanggal Update",
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
              <Link
                className="Btn-see text-white"
                to={`/inventory-detail/${value.idCategory}`}
              >
                <span className="svgContainer">
                  <IoEyeSharp className="text-xl " />
                </span>
                <span className="BG bg-blue-600"></span>
              </Link>
            </div>
          );
        },
      },
    },
  ];

  const data = dataDisplay.map((a) => {
    return {
      categoryName: a.categoryName,
      jumlahStok: a.jumlahStok,
      dateUpdate: a.dateUpdate,
      data: a,
    };
  });

  console.log(dataDetail, "Detail data");
  return (
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
          <div className="w-full h-full flex flex-col justify-start items-center">
            <div
              data-aos="slide-down"
              data-aos-delay="50"
              className="w-full flex justify-center items-center bg-gradient-to-r from-[#1d4ed8] to-[#8aa9fd] p-2 rounded-md"
            >
              <h3 className="text-white text-base font-normal">List Stok</h3>
            </div>

            <div className="w-full flex justify-start gap-5 items-center mt-10 h-full mb-5">
              <div
                data-aos="fade-up"
                data-aos-delay="150"
                className="cookieCard w-[40%] p-6"
              >
                <div className="cookieDescription">
                  <h3 className="text-xl font-medium">{totalStok} Stok</h3>
                </div>
                <h3 className="text-xs font-normal text-white w-full">
                  Total Jumlah Stok Saat Ini
                </h3>
                <div className="z-[9999] absolute right-[5%] p-4 flex justify-center items-center bg-white rounded-full">
                  <FaLuggageCart className="text-blue-600 text-[2rem]" />
                </div>
              </div>
              <div
                data-aos="fade-up"
                data-aos-delay="250"
                className="w-[33%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
              >
                <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
                  <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                    <div className="w-full flex justify-start gap-4 items-center">
                      <h3 className="text-xl font-medium">
                        {totalStokMasuk} Stok
                      </h3>
                    </div>
                    <div className="w-full flex justify-start gap-4 items-center">
                      <h3 className="text-xs font-normal">
                        Total Stok Masuk Bulan {bulan} {tahun}
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
                data-aos-delay="350"
                className="w-[33%] h-[8rem] rounded-xl p-3 py-4 shadow-md bg-white flex flex-col justify-between items-center "
              >
                <div className="w-[100%] h-[8rem]  border-l-4 border-l-blue-700 p-3 py-2  bg-white flex  justify-start gap-3 items-center">
                  <div className="w-[80%] flex flex-col justify-center gap-4 items-start">
                    <div className="w-full flex justify-start gap-4 items-center">
                      <h3 className="text-xl font-medium">
                        {totalStokKeluar} Stok
                      </h3>
                    </div>
                    <div className="w-full flex justify-start gap-4 items-center">
                      <h3 className="text-xs font-normal">
                        Total Stok Keluar Bulan {bulan} {tahun}
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
            </div>
            <TabBar
              data-aos="fade-up"
              data-aos-delay="450"
              data={allTabs}
              onTabChange={handleTabChange}
            />

            <div
              data-aos="fade-up"
              data-aos-delay="550"
              className="w-full flex justify-end gap-4 mt-5 items-center p-2 rounded-md"
            >
              {/* <button
            onClick={() => {
              if (isDetail) {
                setIsDetail(false);
              }
              setIsOpen(!isOpen);
              setForm("supplier");
            }}
            type="button"
            className="bg-blue-500 text-center w-[12rem] rounded-2xl h-10 relative text-black text-xs font-medium group"
          >
            <div className="bg-white rounded-xl h-8 w-1/5 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[95%] z-10 duration-500">
              <FaRegAddressCard className="text-[16px] text-blue-700 hover:text-blue-700" />
            </div>
            <p className="translate-x-2 text-[0.65rem] text-white">
              Tambah Supplier
            </p>
          </button>
          <button
            onClick={() => {
              if (isDetail) {
                setIsDetail(false);
              }
              setIsOpen(!isOpen);
              setForm("pemesanan");
            }}
            type="button"
            className="bg-blue-500 text-center w-[16rem] rounded-2xl h-10 relative text-black text-xs font-medium group"
          >
            <div className="bg-white rounded-xl h-8 w-1/5 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[96%] z-10 duration-500">
              <MdAddShoppingCart className="text-[16px] text-blue-700 hover:text-blue-700" />
            </div>
            <p className="translate-x-2 text-[0.65rem] text-white">
              Tambah Pemesanan
            </p>
          </button>
          <button
            onClick={() => {
              if (isDetail) {
                setIsDetail(false);
              }
              setIsOpen(!isOpen);
              setForm("penerimaan");
            }}
            type="button"
            className="bg-blue-500 text-center w-[16rem] rounded-2xl h-10 relative text-black text-xs font-medium group"
          >
            <div className="bg-white rounded-xl h-8 w-1/5 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[96%] z-10 duration-500">
              <FaPeopleCarryBox className="text-[16px] text-blue-700 hover:text-blue-700" />
            </div>
            <p className="translate-x-2 text-[0.65rem] text-white">
              Tambah Penerimaan
            </p>
          </button> */}
              <button
                onClick={() => {
                  if (isDetail) {
                    setIsDetail(false);
                  }
                  setIsOpen(!isOpen);
                  setForm("stok");
                }}
                type="button"
                className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xs font-medium group"
              >
                <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[95%] z-10 duration-500">
                  <IoAddCircleOutline className="text-[18px] text-blue-700 hover:text-blue-700" />
                </div>
                <p className="translate-x-2 text-[0.65rem] text-white">
                  Tambah Data
                </p>
              </button>
            </div>
            <div
              className={`w-full ${
                !isDetail ? "h-0 p-0" : "h-auto p-6 mt-3"
              } duration-500 flex-col justify-start items-start rounded-md bg-white shadow-md`}
            >
              <div
                className={`w-full ${
                  !isDetail ? "hidden" : "flex flex-col"
                } justify-start items-start gap-4`}
              >
                <h5 className="text-base font-medium">Barang ID</h5>
                <p className="text-xs font-normal">{dataDetail.barang_id}</p>
                <h5 className="text-base font-medium">Jumlah Stok</h5>
                <p className="text-xs font-normal">{dataDetail.jumlah_stok}</p>
                <h5 className="text-base font-medium">Tanggal Update</h5>
                <p className="text-xs font-normal">
                  {dataDetail.tanggal_update}
                </p>
                <h5 className="text-base font-medium">Keterangan</h5>
                <p className="text-xs font-normal">{dataDetail.keterangan}</p>
              </div>
            </div>

            {form == "supplier" && (
              <>
                <div
                  className={`w-full ${
                    !isOpen ? "h-0 p-0" : "h-auto p-4  mt-3"
                  } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md`}
                >
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-full border-b p-2 border-b-blue-600`}
                  >
                    <h4 className="text-base font-medium">
                      Tambah Data Supplier
                    </h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 mt-5`}
                  >
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Nama Supplier</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Alamat</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">
                        No Whats'app (Gunakan Format 62 )
                      </h4>
                      <input
                        type="number"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Keterangan</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                  </div>

                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4`}
                  >
                    <div className="text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
                      <button
                        type="button"
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <FaRegSave className="text-[16px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-[0.65rem] text-white">
                          Simpan Data
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {form == "pemesanan" && (
              <>
                <div
                  className={`w-full ${
                    !isOpen ? "h-0 p-0" : "h-auto p-4  mt-3"
                  } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md`}
                >
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-full border-b p-2 border-b-blue-600`}
                  >
                    <h4 className="text-base font-medium">
                      Tambah Data Pemesanan
                    </h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-[50%] p-2 mt-5 `}
                  >
                    <h4 className="text-sm font-medium">Supplier</h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 pl-8`}
                  >
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Pilih Supplier</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Nama Supplier</h4>
                      <div
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      >
                        {" "}
                      </div>
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">
                        No Whats'app Supplier
                      </h4>
                      <div
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      ></div>
                    </div>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-[50%] p-2 mt-5`}
                  >
                    <h4 className="text-sm font-medium">Barang</h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 pl-8 pr-2`}
                  >
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Barang ID</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Jumlah Stok</h4>
                      <input
                        type="number"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Tanggal </h4>
                      <input
                        type="date"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                  </div>
                  {additionalForms.map((form, index) => (
                    <div
                      key={index}
                      className={`w-full ${
                        !isOpen ? "hidden" : "flex"
                      } justify-start items-center gap-4 pl-8 pr-2 `}
                    >
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Barang ID</h4>
                        <input
                          type="text"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={form.barang_id}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "barang_id",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Jumlah Stok</h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={form.jumlah_stok}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "jumlah_stok",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Tanggal </h4>
                        <input
                          type="date"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={form.tanggal_update}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "tanggal_update",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="w-[4%] text-xs flex flex-col justify-end items-end gap-4 h-[4rem] pr-2 ">
                        <button
                          className="w-[2rem] h-[2rem] flex justify-center items-center rounded-full  bg-red-200 border border-red-700 hover:bg-red-600 text-red-600 hover:text-white"
                          onClick={() => removeForm(index)}
                        >
                          <RiDeleteBin5Line className="text-base" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4`}
                  >
                    <div className="text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
                      <button
                        type="button"
                        onClick={addNewForm}
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <PiShoppingCartBold className="text-[16px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-[0.65rem] text-white">
                          Tambah Data
                        </p>
                      </button>
                    </div>
                    <div className="text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
                      <button
                        type="button"
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <FaRegSave className="text-[16px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-[0.65rem] text-white">
                          Simpan Data
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {form == "penerimaan" && (
              <>
                <div
                  className={`w-full ${
                    !isOpen ? "h-0 p-0" : "h-auto p-4  mt-3"
                  } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md`}
                >
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-full border-b p-2 border-b-blue-600`}
                  >
                    <h4 className="text-base font-medium">
                      Tambah Data Penerimaan
                    </h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-[50%] p-2 mt-5 `}
                  >
                    <h4 className="text-sm font-medium">Pemesanan</h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 pl-8`}
                  >
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">No Pemesanan</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Nama Supplier</h4>
                      <div
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      >
                        {" "}
                      </div>
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Tanggal Pemesanan</h4>
                      <div
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      ></div>
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">
                        Tanggal Penerimaan
                      </h4>
                      <input
                        type="date"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-[50%] p-2 mt-5`}
                  >
                    <h4 className="text-sm font-medium">Barang Pesanan</h4>
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 pl-8`}
                  >
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Barang ID</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">
                        Jumlah Stok Dipesan
                      </h4>
                      <input
                        type="number"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">
                        Jumlah Stok Diterima
                      </h4>
                      <input
                        type="number"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>

                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Keterangan</h4>
                      <input
                        type="text"
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div>
                  </div>
                  {additionalForms.map((form, index) => (
                    <div
                      key={index}
                      className={`w-full ${
                        !isOpen ? "hidden" : "flex"
                      } justify-start items-center gap-4 pl-8`}
                    >
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Barang ID</h4>
                        <input
                          type="text"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={form.barang_id}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "barang_id",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">
                          Jumlah Stok Dipesan
                        </h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                        />
                      </div>
                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">
                          Jumlah Stok Diterima
                        </h4>
                        <input
                          type="number"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={form.jumlah_stok}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "jumlah_stok",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                        <h4 className="font-medium text-xs">Keterangan</h4>
                        <input
                          type="text"
                          className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          value={form.keterangan}
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "keterangan",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  ))}
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4`}
                  >
                    <div className="text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
                      <button
                        type="button"
                        onClick={addNewForm}
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <PiShoppingCartBold className="text-[16px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-[0.65rem] text-white">
                          Tambah Data
                        </p>
                      </button>
                    </div>
                    <div className="text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
                      <button
                        type="button"
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <FaRegSave className="text-[16px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-[0.65rem] text-white">
                          Simpan Data
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {form == "stok" && (
              <>
                <div
                  className={`w-full ${
                    !isOpen ? "h-0 p-0" : "h-auto p-4  mt-3"
                  } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md`}
                >
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 w-full border-b p-2 border-b-blue-600`}
                  >
                    <h4 className="text-base font-medium">
                      Tambah Data Stok Barang
                    </h4>
                  </div>

                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4 pl-8 pr-14 mt-5`}
                  >
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Barang ID</h4>
                      <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                        <DropdownSearch
                          change={(data) => {
                            setBarang(data);
                            setRefresh(true);
                          }}
                          options={dataItems}
                          refresh={refresh}
                          value={barang}
                          name={"Barang"}
                        />
                      </div>
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Satuan</h4>
                      <input
                        type="text"
                        value={satuan}
                        onChange={(e) => {
                          setSatuan(e.target.value);
                        }}
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
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
                  </div>
                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-end gap-4 pl-8 pr-14`}
                  >
                    <div className="w-[32%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Tanggal </h4>

                      <Space direction="vertical" size={12}>
                        <DatePicker
                          defaultValue={dayjs(tanggal, dateFormatList[0])}
                          format={dateFormatList}
                          onChange={(date) => {
                            handleChangeDate("mulaiTanggal", date);
                          }}
                          className="w-[12rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                        />
                      </Space>
                    </div>
                    <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Tanggal Exp. </h4>

                      <Space direction="vertical" size={12}>
                        <DatePicker
                          defaultValue={dayjs(tanggalExp, dateFormatList[0])}
                          format={dateFormatList}
                          onChange={(date) => {
                            handleChangeDate("tanggalExp", date);
                          }}
                          className="w-[12rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                        />
                      </Space>
                    </div>
                    <button
                      type="button"
                      onClick={addNewForm}
                      className="bg-blue-500 text-center w-48 rounded-2xl h-10 mb-2 relative text-black text-xl font-semibold group"
                    >
                      <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                        <PiShoppingCartBold className="text-[16px] text-blue-700 hover:text-blue-700" />
                      </div>
                      <p className="translate-x-2 text-[0.65rem] text-white">
                        Tambah Data
                      </p>
                    </button>
                    {/* <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                      <h4 className="font-medium text-xs">Keterangan</h4>
                      <input
                        type="text"
                        onChange={(e) => {
                          setKeterangan(e.target.value);
                        }}
                        value={keterangan}
                        className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      />
                    </div> */}
                  </div>
                  <div className="w-full mt-5 flex justify-center items-center px-6">
                    <div className="w-full  flex justify-between items-center p-2 rounded-md bg-blue-600 text-white text-xs font-medium">
                      <div className="w-[20%] flex justify-center items-center">
                        Barang
                      </div>
                      <div className="w-[20%] flex justify-center items-center">
                        Stok
                      </div>
                      <div className="w-[20%] flex justify-center items-center">
                        Tanggal
                      </div>
                      <div className="w-[20%] flex justify-center items-center">
                        Tanggal Exp.
                      </div>
                    </div>
                  </div>
                  <div className="w-full mt-2 flex flex-col justify-between items-center rounded-md text-xs font-medium">
                    {additionalForms.map((form, index) => (
                      <>
                        <div className="w-full mt-2 flex border border-blue-500 shadow-md justify-between items-center p-2 rounded-md  text-xs font-medium">
                          <div className="w-[20%] flex justify-center items-center">
                            {form.barang.text}
                          </div>
                          <div className="w-[20%] flex justify-center items-center">
                            {form.stok} {form.satuan}
                          </div>
                          <div className="w-[20%] flex justify-center items-center">
                            {form.tanggal}
                          </div>
                          <div className="w-[20%] flex justify-center items-center">
                            {form.tanggalExp}
                          </div>
                        </div>
                      </>
                    ))}
                  </div>

                  <div
                    className={`w-full ${
                      !isOpen ? "hidden" : "flex"
                    } justify-start items-center gap-4`}
                  >
                    <div className="text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <FaRegSave className="text-[16px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-[0.65rem] text-white">
                          Simpan Data
                        </p>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTabIndex == "tab1" ? (
              <>
                <div
                  data-aos="fade-up"
                  className="w-full flex justify-center items-start mt-5 h-[32rem]  mb-28"
                >
                  {isData1 ? (
                    <>
                      <LoaderTable />
                    </>
                  ) : (
                    <>
                      <Paper
                        data-aos="fade-up"
                        style={{ height: 400, width: "100%" }}
                      >
                        <MUIDataTable
                          columns={columns}
                          data={data}
                          options={{
                            fontSize: 12,
                          }}
                          pagination
                          rowsPerPageOptions={[10, { value: -1, label: "All" }]}
                        />
                      </Paper>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="w-full flex flex-col justify-start items-center h-full mt-5">
                  <div
                    data-aos="fade-up"
                    className="w-full rounded-xl p-4 flex justify-between items-center bg-white shadow-md"
                  >
                    <h3 className="text-base font-medium">
                      Perubahan Stok Bulan, {bulan} {tahun}
                    </h3>
                    <div className="w-[50%] flex justify-end items-center gap-6">
                      <div className="w-[40%] flex justify-between items-center">
                        <p className="text-sm font-normal">Bulan</p>
                        <Space direction="vertical" size={12}>
                          <DatePicker
                            defaultValue={dayjs(bulan, "MMMM")}
                            format={["MMMM"]}
                            picker="month"
                            onChange={(date) => {
                              setBulan(date.format("MMMM"));
                              getHistoryInventory(date.format("MMMM"), tahun);
                            }}
                            className="w-[6rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          />
                        </Space>
                      </div>
                      <div className="w-[40%] flex justify-between items-center">
                        <p className="text-sm font-normal">Tahun</p>
                        <Space direction="vertical" size={12}>
                          <DatePicker
                            defaultValue={dayjs(tahun, "YYYY")}
                            format={["YYYY"]}
                            picker="year"
                            onChange={(date) => {
                              setTahun(date.format("YYYY"));
                              getHistoryInventory(bulan, date.format("YYYY"));
                            }}
                            className="w-[6rem] flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                          />
                        </Space>
                      </div>
                    </div>
                  </div>
                  {isData2 ? (
                    <>
                      <LoaderTable />
                    </>
                  ) : (
                    <>
                      <TableHistory
                        data={dataHistory}
                        fetchdata={getHistoryInventory}
                      />
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default MasterInventory;
