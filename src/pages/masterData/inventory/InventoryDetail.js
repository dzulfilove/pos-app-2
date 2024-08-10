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
import withRouter from "../../../component/features/withRouter";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "../../../config/database";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import { IoEyeSharp } from "react-icons/io5";
import { BiArchive } from "react-icons/bi";
import AOS from "aos";
import "aos/dist/aos.css";
import LoaderTable from "../../../component/features/loader2";
function InventoryDetail({ params }) {
  const [isOpen, setIsOpen] = useState(false);
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
  const [isData, setIsData] = useState(true);

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

  const formatTanggal = (value) => {
    const formattedDate = dayjs(value, "DD/MM/YYYY").format("D MMMM YYYY");
    return formattedDate;
  };

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
      name: "minStok",
      label: "Stok Min.",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "maxStok",
      label: "Stok Maks.",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "stok",
      label: "Jumlah Stok",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const rowData = tableMeta.rowData; // Mengambil rowData dari tableMeta
          return (
            <div
              className={`flex justify-start items-center gap-2 w-full ${
                value <= rowData[1] // Menggunakan index yang sesuai untuk minStok
                  ? "bg-red-200 border border-red-700 rounded-xl p-2"
                  : ""
              }`}
            >
              {value}
            </div>
          );
        },
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

  // Mengambil data dari state dan memetakan ke format yang diinginkan
  const data = dataStok.map((a) => {
    return {
      id: a.id,
      item: a.item.itemName, // Pastikan itemName ada dalam data item
      minStok: a.item.minStock,
      maxStok: a.item.maxStock,
      stok: a.stock,
      dateUpdate: a.dateUpdate,
      info: a.info, // Pastikan info ada dalam data
      data: {
        id: a.id,
        item: a.item.itemName, // Pastikan itemName ada dalam data item
        minStok: a.item.minStock,
        maxStok: a.item.maxStock,
        stok: a.stock,
        dateUpdate: a.dateUpdate,
        info: a.info, // Pastikan info ada dalam data
      }, // Menyimpan objek data lengkap jika diperlukan
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
          className="bg-white shadow-md w-full p-6 rounded-xl flex justify-start items-center mt-5 "
        >
          <h3 className="text-base text-blue-600 font-medium">
            Stok Voucher Kuota
          </h3>
        </div>
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
            <h5 className="text-xl font-medium text-blue-600">Detail Info</h5>
            <h5 className="text-base font-medium">Barang</h5>
            <p className="text-xs font-normal">{dataDetail.item}</p>
            <h5 className="text-base font-medium">Jumlah Stok</h5>
            <p className="text-xs font-normal">{dataDetail.stok}</p>
            <h5 className="text-base font-medium">Tanggal Update</h5>
            <p className="text-xs font-normal">
              {formatTanggal(dataDetail.dateUpdate)}
            </p>
            <h5 className="text-base font-medium">Keterangan</h5>
            <p className="text-xs font-normal">{dataDetail.info}</p>
          </div>
        </div>
        <div
          data-aos="fade-up"
          className="w-full flex justify-center items-center mt-5 h-full mb-28"
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
                  data={data}
                  options={{
                    fontSize: 12,
                  }}
                />
              </Paper>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default withRouter(InventoryDetail);
