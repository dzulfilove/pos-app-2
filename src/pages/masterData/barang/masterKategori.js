import React, { useEffect, useState } from "react";
import MUIDataTable from "mui-datatables";
import "../../../styles/card.css";
import { Paper, Button } from "@mui/material";
import { FaLuggageCart, FaRegSave } from "react-icons/fa";
import { IoAddCircleOutline } from "react-icons/io5";
import { IoEyeSharp } from "react-icons/io5";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { RiPencilFill } from "react-icons/ri";
import { db } from "../../../config/database";
import Swal from "sweetalert2";
import { MdDelete } from "react-icons/md";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../../component/features/loader";
import LoaderTable from "../../../component/features/loader2";
function MasterKategori() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [kategori, setKategori] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [indexDetail, setIndexDetail] = useState(0);
  const [dataCategory, setDataCategory] = useState([]);
  const [isLoad, setIsLoad] = useState(false);
  const [isData, setIsData] = useState(true);

  useEffect(() => {
    getAllCategory();
  }, []);
  const getAllCategory = async () => {
    try {
      // Ambil semua dokumen dari koleksi category
      const categoryQuerySnapshot = await getDocs(collection(db, "category"));

      if (categoryQuerySnapshot.empty) {
        console.log("Tidak ada kategori yang ditemukan.");
        return;
      }

      let categoriesData = [];
      for (const doc of categoryQuerySnapshot.docs) {
        const categoryData = { id: doc.id, ...doc.data() };

        // Ambil semua dokumen dari koleksi items yang memiliki referensi itemCategory ke kategori ini
        const itemsQuerySnapshot = await getDocs(collection(db, "items"));

        let itemCount = 0;
        itemsQuerySnapshot.forEach((itemDoc) => {
          if (itemDoc.data().itemCategory.id === doc.id) {
            itemCount++;
          }
        });

        categoryData.jumlahBarang = itemCount;
        categoriesData.push(categoryData);
      }

      console.log(categoriesData);
      setDataCategory(categoriesData);
      setIsData(false);
    } catch (error) {
      console.error(
        "Error fetching categories and item counts:",
        error.message
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoad(true);

    // Cek jika state kosong
    if (!kategori || !deskripsi) {
      let missingFields = [];
      if (!kategori) missingFields.push("Nama Kategori");
      if (!deskripsi) missingFields.push("Deskripsi");
      setIsLoad(false);

      Swal.fire(
        "Error",
        `${missingFields.join(" dan ")} tidak boleh kosong`,
        "error"
      );
      return;
    }
    try {
      await addDoc(collection(db, "category"), {
        nameCategory: kategori,
        description: deskripsi,
      });
      setIsLoad(false);

      Swal.fire("Success", "Category added successfully", "success");
      setKategori("");
      setDeskripsi("");
      getAllCategory();
    } catch (error) {
      setIsLoad(false);

      console.error("Error adding category: ", error);
      Swal.fire("Error", "Failed to add category", "error");
    }
  };

  const updateClick = (data) => {
    setIsEdit(true);
    setIsOpen(true);
    setIsAdd(false);
    setIndexDetail(data.id);
    setKategori(data.nameCategory);
    setDeskripsi(data.description);
  };
  const handleUpdate = async () => {
    const data = {
      nameCategory: kategori,
      description: deskripsi,
    };
    try {
      // Buat referensi ke dokumen kategori yang ingin diperbarui
      const categoryRef = doc(db, "category", indexDetail);

      // Perbarui data di Firestore
      await updateDoc(categoryRef, data);
      setKategori("");
      setDeskripsi("");
      setIsOpen(false);
      setIsEdit(false);
      setIsAdd(true);
      // Tampilkan alert sukses
      Swal.fire({
        title: "Sukses!",
        text: "Data kategori berhasil diperbarui.",
        icon: "success",
        confirmButtonText: "OK",
      });
      getAllCategory();
    } catch (error) {
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
  const handleDetailData = (id) => {
    console.log(id);

    if (indexDetail === id.id && isDetail) {
      setIsDetail(false);
    } else {
      setIsDetail(true);
    }

    setIndexDetail(id.id);
    setIsOpen(false);
    setDataDetail(id);
  };

  const deleteCategory = async (categoryId) => {
    const confirmDelete = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Anda yakin ingin menghapus kategori ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (confirmDelete.isConfirmed) {
      try {
        // Buat referensi ke dokumen kategori yang ingin dihapus
        const categoryRef = doc(db, "category", categoryId.id);

        // Hapus dokumen dari Firestore
        await deleteDoc(categoryRef);

        // Tampilkan alert sukses
        Swal.fire({
          title: "Sukses!",
          text: "Kategori berhasil dihapus.",
          icon: "success",
          confirmButtonText: "OK",
        });
        getAllCategory();
      } catch (error) {
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
      name: "Nama",
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
      name: "Deskripsi",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "Jumlah Barang",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              <button
                className="Btn-see text-white"
                onClick={() => {
                  handleDetailData(tableMeta.rowData[3]); // Kirim objek lengkap
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
                  updateClick(tableMeta.rowData[3]); // Kirim objek lengkap
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
                  deleteCategory(tableMeta.rowData[3]); // Kirim objek lengkap
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

  const options = {
    selectableRows: false,
    elevation: 0,
    rowsPerPage: 5,
    rowsPerPageOptions: [5, 10],
  };

  // Membuat listData tanpa menampilkan id
  const listData = dataCategory.map((data) => [
    data.nameCategory,
    data.description,
    data.jumlahBarang,
    data, // Tambahkan objek lengkap di sini
  ]);

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
          <div className="w-full h-full flex flex-col justify-start items-center pb-25">
            <div
              data-aos="slide-down"
              data-aos-delay="50"
              className="w-full flex justify-center items-center bg-gradient-to-r from-[#1d4ed8] to-[#a2bbff] p-2 rounded-md"
            >
              <h3 className="text-white text-base font-normal">
                List Kategori
              </h3>
            </div>
            <div className="w-full flex justify-start gap-10 items-center mt-10 h-full">
              <div
                data-aos="fade-up"
                data-aos-delay="250"
                className="cookieCard w-[40%]"
              >
                <div className="cookieDescription">
                  <h3 className="text-xl font-medium">
                    {dataCategory.length} Kategori
                  </h3>
                </div>
                <h3 className="text-xs font-normal text-white w-full">
                  Total Kategori Barang
                </h3>
                <div className="z-[9999] absolute right-[5%] p-4 flex justify-center items-center bg-white rounded-full shadow-lg">
                  <FaLuggageCart className="text-blue-700 text-[2rem]" />
                </div>
              </div>
            </div>
            <div
              data-aos="fade-up"
              data-aos-delay="350"
              className="w-full flex justify-end items-center p-2 rounded-md"
            >
              <button
                onClick={() => {
                  if (isDetail) {
                    setIsDetail(false);
                  }
                  if (isEdit == true) {
                    setIsOpen(true);
                    setIsEdit(false);
                    setIsAdd(true);
                    setKategori("");
                    setDeskripsi("");
                  } else {
                    setIsOpen(!isOpen);
                    setIsEdit(false);
                    setIsAdd(true);
                  }
                }}
                type="button"
                className="bg-blue-500 text-center w-48 rounded-2xl h-10 relative text-black text-xl font-semibold group"
              >
                <div className="bg-white rounded-xl h-8 w-1/4 flex items-center justify-center absolute left-1 top-[4px] group-hover:w-[184px] z-10 duration-500">
                  <IoAddCircleOutline className="text-[25px] text-blue-700 hover:text-blue-700" />
                </div>
                <p className="translate-x-2 text-xs text-white">Tambah Data</p>
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
                <h5 className="text-base font-medium">Nama Barang</h5>
                <p className="text-xs font-normal">{dataDetail.nameCategory}</p>
                <p className="text-xs font-normal">{dataDetail.description}</p>
                <h5 className="text-base font-medium">Jumlah Barang</h5>
                <p className="text-xs font-normal">{dataDetail.jumlahBarang}</p>
              </div>
            </div>
            <div
              className={`w-full ${
                !isOpen ? "h-0 p-0" : "h-[7rem] p-2 mt-3"
              } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md`}
            >
              <div
                className={`w-full ${
                  !isOpen ? "hidden" : "flex"
                } justify-start items-center gap-4`}
              >
                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Nama Kategori</h4>
                  <input
                    type="text"
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value)}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Deskripsi</h4>
                  <input
                    type="text"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
                <div className="w-[33%] text-xs flex flex-col justify-end items-start p-2 gap-4 pt-8">
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
                        onClick={handleSubmit}
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
            </div>
            <div
              data-aos="fade-up"
              data-aos-delay="450"
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
                      data={listData}
                      options={{
                        margin: 12,
                        fontSize: 12, // adjust font size here
                      }}
                      pagination
                      rowsPerPageOptions={[10, 50, { value: -1, label: "All" }]}
                    />
                  </Paper>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default MasterKategori;
