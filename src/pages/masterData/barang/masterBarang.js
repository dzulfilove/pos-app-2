import React, { useEffect, useState } from "react";
import TableData from "../../../component/masterBarang/table";
import MUIDataTable from "mui-datatables";
import "../../../styles/card.css";
import { Paper, TablePagination, Button } from "@mui/material";
import DropdownSearch from "../../../component/features/dropdown";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../config/database";
import Swal from "sweetalert2";
import { FaLuggageCart, FaRegSave } from "react-icons/fa";
import { RiPencilFill } from "react-icons/ri";
import { MdDelete } from "react-icons/md";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoEyeSharp } from "react-icons/io5";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../../component/features/loader";
import LoaderTable from "../../../component/features/loader2";
function MasterBarang() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [isDetail, setIsDetail] = useState(false);
  const [dataCategory, setDataCategory] = useState([]);
  const [dataDetail, setDataDetail] = useState({});
  const [indexDetail, setIndexDetail] = useState(0);
  const [namaBarang, setNamaBarang] = useState("");
  const [satuan, setSatuan] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [hargaBeli, setHargaBeli] = useState(0);
  const [hargaJual, setHargaJual] = useState(0);
  const [stokMaksimal, setStokMaksimal] = useState(0);
  const [stokMinimal, setStokMinimal] = useState(0);
  const [kategoriBarang, setKategoriBarang] = useState({});
  const [dataBarang, setDataBarang] = useState([]);
  const [isLoad, setIsLoad] = useState(false);
  const [isData, setIsData] = useState(true);

  useEffect(() => {
    fetchCategories();
    getItems();
  }, []);
  const fetchCategories = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "category"));
      const categoriesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const dataOption = categoriesArray.map((a) => {
        return { value: a.id, text: a.nameCategory };
      });
      setDataCategory(dataOption);
    } catch (error) {
      console.error("Error fetching categories: ", error);
    }
  };

  const getItems = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "items"));
      const items = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const data = doc.data();
          const categoryRef = data.itemCategory;
          const categoryDoc = await getDoc(categoryRef);
          const categoryData = categoryDoc.data();
          return {
            id: doc.id,
            ...data,
            itemCategory: categoryRef.id,
            categoryName: categoryData.nameCategory, // Menambahkan property baru untuk menyimpan nama kategori
          };
        })
      );
      console.log("baang", items);
      setDataBarang(items);
      setIsData(false);
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
  const handleAdd = async () => {
    // Cek apakah semua field yang diperlukan terisi
    setIsLoad(true);

    if (
      !namaBarang ||
      !satuan ||
      !deskripsi ||
      hargaBeli <= 0 ||
      hargaJual <= 0 ||
      stokMaksimal <= 0 ||
      stokMinimal <= 0 ||
      !kategoriBarang.value
    ) {
      setIsLoad(false);

      Swal.fire({
        title: "Peringatan!",
        text: "Harap lengkapi semua field sebelum menambahkan barang.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return; // Hentikan eksekusi jika ada field yang kosong
    }

    try {
      // Buat referensi ke dokumen dalam koleksi category
      const categoryRef = doc(db, "category", kategoriBarang.value);

      const docRef = await addDoc(collection(db, "items"), {
        itemName: namaBarang,
        itemDescription: deskripsi,
        buyPrice: hargaBeli,
        sellPrice: hargaJual,
        maxStock: stokMaksimal,
        minStock: stokMinimal,
        unit: satuan,
        itemCategory: categoryRef, // Simpan referensi ke dokumen category
      });
      setIsLoad(false);

      Swal.fire(
        "Berhasil!",
        "Data berhasil " + namaBarang + " ditambahkan.",
        "success"
      );

      getItems();
      setIsAdd(true);
      setIsEdit(false);
      setIsOpen(false);

      // Reset state setelah berhasil menambah data
      setNamaBarang("");
      setDeskripsi("");
      setSatuan("");
      setHargaBeli(0);
      setHargaJual(0);
      setStokMaksimal(0);
      setStokMinimal(0);
      setKategoriBarang({});
    } catch (e) {
      setIsLoad(false);

      Swal.fire("Error!", "Gagal menambahkan data: " + e.message, "error");
    }
  };

  const updateClick = (data) => {
    setIsEdit(true);
    setIsOpen(true);
    setIsAdd(false);
    setIndexDetail(data.id);
    setNamaBarang(data.itemName);
    setDeskripsi(data.itemDescription);
    setHargaBeli(data.buyPrice);
    setHargaJual(data.sellPrice);
    setSatuan(data.unit);
    setStokMaksimal(data.maxStock);
    setStokMinimal(data.minStock);
    const option = dataCategory.filter((a) => a.value == data.itemCategory);
    console.log(option, "upd");
    setKategoriBarang(option[0]);
  };
  const handleUpdate = async () => {
    setIsLoad(true);

    const categoryRef = doc(db, "category", kategoriBarang.value);
    const data = {
      itemName: namaBarang,
      itemDescription: deskripsi,
      buyPrice: hargaBeli,
      sellPrice: hargaJual,
      maxStock: stokMaksimal,
      unit: satuan,
      minStock: stokMinimal,
      itemCategory: categoryRef, // Simpan referensi ke dokumen category
    };
    try {
      // Buat referensi ke dokumen kategori yang ingin diperbarui
      const itemsRef = doc(db, "items", indexDetail);

      // Perbarui data di Firestore
      await updateDoc(itemsRef, data);
      setNamaBarang("");
      setDeskripsi("");
      setHargaBeli(0);
      setHargaJual(0);
      setStokMaksimal(0);
      setStokMinimal(0);
      setKategoriBarang({});
      setIsOpen(false);
      setSatuan("");
      setIsEdit(false);
      setIsAdd(true);
      // Tampilkan alert sukses
      setIsLoad(false);

      Swal.fire({
        title: "Sukses!",
        text: "Data kategori berhasil diperbarui.",
        icon: "success",
        confirmButtonText: "OK",
      });
      getItems();
    } catch (error) {
      setIsLoad(false);

      console.error("Error updating category:", error.message);
      // Tampilkan alert error
      Swal.fire({
        title: "Error!",
        text: "Terjadi kesalahan saat memperbarui data kategori.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  const deleteItem = async (item) => {
    const confirmDelete = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Anda yakin ingin menghapus Barang ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (confirmDelete.isConfirmed) {
      setIsLoad(true);

      try {
        // Buat referensi ke dokumen kategori yang ingin dihapus
        const itemRef = doc(db, "items", item.id);

        // Hapus dokumen dari Firestore
        await deleteDoc(itemRef);
        setIsLoad(false);

        // Tampilkan alert sukses
        Swal.fire({
          title: "Sukses!",
          text: "Barang berhasil dihapus.",
          icon: "success",
          confirmButtonText: "OK",
        });
        getItems();
      } catch (error) {
        setIsLoad(false);

        console.error("Error deleting category:", error.message);
        // Tampilkan alert error
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat menghapus kategori.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };
  const columns = [
    {
      name: "namaBarang",
      label: "Nama",
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
      name: "deskripsi",
      label: "Deskripsi",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "hargaBeli",
      label: "Harga Beli",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "hargaJual",
      label: "Harga Jual",
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
              <button
                className="Btn-see text-white"
                onClick={() => {
                  updateClick(value); // Kirim objek lengkap
                }}
              >
                <span className="svgContainer">
                  <RiPencilFill className="text-xl " />
                </span>
                <span className="BG bg-emerald-500"></span>
              </button>
              <button
                className="Btn-see text-white"
                onClick={() => {
                  deleteItem(value); // Kirim objek lengkap
                }}
              >
                <span className="svgContainer">
                  <MdDelete className="text-xl " />
                </span>
                <span className="BG bg-red-500"></span>
              </button>
            </div>
          );
        },
      },
    },
  ];
  const data = dataBarang.map((a) => {
    return {
      namaBarang: a.itemName,
      deskripsi: a.itemDescription,
      hargaBeli: a.buyPrice,
      hargaJual: a.sellPrice,
      minStock: a.minStock,
      maxStock: a.maxStock,
      data: a,
    };
  });

  console.log(data, "Detail data");
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
                  {" "}
                  List Item Barang
                </h3>
              </div>
              <div className="w-full flex justify-start gap-10 items-center mt-10 h-full">
                <div
                  data-aos="fade-up"
                  data-aos-delay="150"
                  className="cookieCard w-[40%]"
                >
                  <div className="cookieDescription">
                    <h3 className="text-xl font-medium">
                      {dataBarang.length} Barang
                    </h3>
                  </div>
                  <h3 className="text-xs font-normal text-white w-full">
                    Total Item Barang
                  </h3>
                  <div className="z-[999] absolute right-[5%] p-4 flex justify-center items-center bg-white rounded-full">
                    <FaLuggageCart className="text-blue-700  text-[2rem]" />
                  </div>
                </div>
              </div>

              <div
                data-aos="fade-up"
                data-aos-delay="250"
                className="w-full flex justify-end items-center  p-2 rounded-md"
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
              <div
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
                  <p className="text-xs font-normal ">{dataDetail.itemName}</p>
                  <p className="text-xs font-normal ">
                    {dataDetail.itemDescription}
                  </p>
                  <h5 className="text-base font-medium ">Kategori Barang</h5>
                  <p className="text-xs font-normal ">
                    {dataDetail.categoryName}
                  </p>
                  <h5 className="text-base font-medium ">Stok Barang</h5>
                  {/* <div className="flex justify-start gap-6 items-center w-full pl-6">
                <div className="text-xs font-normal w-[15%]">Stok Saat Ini</div>
                <p className="text-xs font-normal ">: 5 Buah</p>
              </div> */}
                  <div className="flex justify-start gap-6 items-center w-full pl-6">
                    <div className="text-xs font-normal w-[15%]">
                      Stok Minimum
                    </div>
                    <p className="text-xs font-normal ">
                      : {dataDetail.minStock} {dataDetail.unit}
                    </p>
                  </div>
                  <div className="flex justify-start gap-6 items-center w-full pl-6">
                    <div className="text-xs font-normal w-[15%]">
                      Stok Maksimum
                    </div>
                    <p className="text-xs font-normal ">
                      : {dataDetail.maxStock} {dataDetail.unit}
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={`w-full ${
                  !isOpen ? "h-0 p-0" : "h-[15rem]  p-2 mt-3  "
                } duration-500 flex-col justify-start items-start rounded-md bg-white shadow-md `}
              >
                <div
                  className={`w-full  ${
                    !isOpen ? "hidden" : "flex "
                  } justify-start items-center gap-4`}
                >
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Nama Barang</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={namaBarang}
                      onChange={(e) => {
                        setNamaBarang(e.target.value);
                      }}
                    />
                  </div>
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Deskripsi</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={deskripsi}
                      onChange={(e) => {
                        setDeskripsi(e.target.value);
                      }}
                    />
                  </div>
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Harga Beli</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={hargaBeli}
                      onChange={(e) => {
                        setHargaBeli(e.target.value);
                      }}
                    />
                  </div>
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Harga Jual</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={hargaJual}
                      onChange={(e) => {
                        setHargaJual(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div
                  className={`w-full ${
                    !isOpen ? "hidden" : "flex "
                  } justify-start items-end gap-4`}
                >
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Kategori Barang</h4>
                    <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                      <DropdownSearch
                        change={(data) => {
                          setKategoriBarang(data);
                        }}
                        options={dataCategory}
                        value={kategoriBarang}
                        name={"Kategori Barang"}
                      />
                    </div>
                  </div>
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Satuan</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={satuan}
                      onChange={(e) => {
                        setSatuan(e.target.value);
                      }}
                    />
                  </div>
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Stok Minimal</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={stokMinimal}
                      onChange={(e) => {
                        setStokMinimal(e.target.value);
                      }}
                    />
                  </div>
                  <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                    <h4 className="font-medium text-xs">Stok Maksimal</h4>
                    <input
                      type="text"
                      className="w-full flex p-2  font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                      value={stokMaksimal}
                      onChange={(e) => {
                        setStokMaksimal(e.target.value);
                      }}
                    />
                  </div>
                </div>
                <div
                  className={`w-full ${
                    !isOpen ? "hidden" : "flex "
                  } justify-start items-end gap-4 mt-3 pl-2`}
                >
                  {isEdit == true && (
                    <>
                      <button
                        type="button"
                        onClick={handleUpdate}
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <FaRegSave className="text-[20px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-xs text-white">
                          Update Data
                        </p>
                      </button>
                    </>
                  )}
                  {isAdd && (
                    <>
                      <button
                        type="button"
                        onClick={handleAdd}
                        className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
                      >
                        <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                          <FaRegSave className="text-[20px] text-blue-700 hover:text-blue-700" />
                        </div>
                        <p className="translate-x-2 text-xs text-white">
                          Simpan Data
                        </p>
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div
                data-aos="fade-up"
                data-aos-delay="350"
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
                        columns={columns}
                        data={data}
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MasterBarang;
