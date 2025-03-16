import React, { useEffect, useRef, useState } from "react";
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
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { RiPencilFill } from "react-icons/ri";
import { auth, db } from "../../../config/database";
import Swal from "sweetalert2";
import { MdDelete } from "react-icons/md";
import AOS from "aos";
import "aos/dist/aos.css";
import Loader from "../../../component/features/loader";
import LoaderTable from "../../../component/features/loader2";
import DropdownSearch from "../../../component/features/dropdown";
import { createUserWithEmailAndPassword } from "firebase/auth";
import firebase from "firebase/compat/app";
function MasterCabang() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [isDetail, setIsDetail] = useState(false);
  const [cabang, setCabang] = useState({});
  const [nama, setNama] = useState("");
  const [alamat, setAlamat] = useState("");
  const [indexDetail, setIndexDetail] = useState(0);
  const [dataCabang, setDataCabang] = useState([]);
  const [isLoad, setIsLoad] = useState(false);
  const [isData, setIsData] = useState(true);
  const [refresh, setRefresh] = useState(true);
  const targetRef = useRef(null);

  useEffect(() => {
    getAllCabang();
    scrollToTarget();
  }, []);
  const scrollToTarget = () => {
    targetRef.current.scrollIntoView({ behavior: "smooth" });
  };

  const getObjectString = (arr, item) => {
    const res = arr.find((x) => x.value === item);
    if (res) {
      return res.branchName;
    }
    return "";
  };
  const getAllCabang = async () => {
    try {
      // Ambil semua dokumen dari koleksi category
      const querySnapshot = await getDocs(collection(db, "branch"));

      if (querySnapshot.empty) {
        console.log("Tidak ada User yang ditemukan.");
        setIsLoad(false);
        setIsData(false);

        return;
      }

      let usersData = [];
      const categoriesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setIsLoad(false);

      console.log(usersData, "user Cabang");
      setDataCabang(categoriesArray);
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
    if (!nama || !alamat) {
      let missingFields = [];
      if (!nama) missingFields.push("Nama");
      if (!alamat) missingFields.push("Alamat");
      if (!cabang) missingFields.push("Cabang Ke");
      setIsLoad(false);

      Swal.fire(
        "Error",
        `${missingFields.join(" dan ")} tidak boleh kosong`,
        "error"
      );
      return;
    }
    let data = {};
    data = {
      branchName: nama + " " + cabang.text,
      address: alamat,
      value: cabang.value,
    };
    try {
      await addDoc(collection(db, "branch"), data);
      setIsLoad(false);

      Swal.fire("Success", "Cabang added successfully", "success");
      setNama("");
      setAlamat("");
      await getAllCabang();
      setRefresh(false);
    } catch (error) {
      setIsLoad(false);

      console.error("Error adding Cabang: ", error);
      Swal.fire("Error", "Failed to add Cabang", "error");
    }
  };

  // Fungsi untuk menyimpan data pengguna ke Firestore (jika diperlukan)

  const updateClick = (data) => {
    scrollToTarget();
    const selCabang = getObject(optionCabang, data.value);

    setIsEdit(true);
    setIsOpen(true);
    setIsAdd(false);
    setCabang(selCabang);
    setIndexDetail(data.id);
    setNama(data.branchName);
    setAlamat(data.address);
  };
  const handleUpdate = async () => {
    const data = {
      branchName: nama + " " + cabang.text,
      value: cabang.value,
      address: alamat,
    };
    try {
      // Buat referensi ke dokumen User yang ingin diperbarui
      const categoryRef = doc(db, "branch", indexDetail);

      // Perbarui data di Firestore
      await updateDoc(categoryRef, data);
      setNama("");
      setAlamat("");
      setIsOpen(false);
      setIsEdit(false);
      setIsAdd(true);
      setRefresh(false);

      // Tampilkan alert sukses
      Swal.fire({
        title: "Sukses!",
        text: "Data Cabang berhasil diperbarui.",
        icon: "success",
        confirmButtonText: "OK",
      });
      await getAllCabang();
    } catch (error) {
      console.error("Error updating Branch:", error.message);
      // Tampilkan alert error
      Swal.fire({
        title: "Error!",
        text: "Terjadi kesalahan saat memperbarui data Cabang.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  };
  const deleteCategory = async (categoryId) => {
    const confirmDelete = await Swal.fire({
      title: "Konfirmasi Hapus",
      text: "Anda yakin ingin menghapus Cabang ini?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus!",
      cancelButtonText: "Batal",
    });

    if (confirmDelete.isConfirmed) {
      try {
        // Buat referensi ke dokumen kategori yang ingin dihapus
        const branchRef = doc(db, "branch", categoryId.id);

        // Hapus dokumen dari Firestore
        await deleteDoc(branchRef);

        // Tampilkan alert sukses
        Swal.fire({
          title: "Sukses!",
          text: "Kategori berhasil dihapus.",
          icon: "success",
          confirmButtonText: "OK",
        });
        await getAllCabang();
      } catch (error) {
        console.error("Error deleting branch:", error.message);
        // Tampilkan alert error
        Swal.fire({
          title: "Error!",
          text: "Terjadi kesalahan saat menghapus cabang.",
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    }
  };

  const getObject = (arr, item) => {
    return arr.find((x) => x.value === item);
  };
  const columns = [
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
                className="border hover:border-blue-500  bg-blue-500 hover:bg-blue-100 flex justify-center items-center px-4 py-2 rounded-lg text-blue-100 hover:text-blue-500"
                onClick={() => {
                  sessionStorage.setItem("cabang", value.value);
                  sessionStorage.setItem("branchName", value.branchName);
                  window.location.reload();
                }}
              >
                Pilih
              </button>
            </div>
          );
        },
      },
    },
    {
      name: "data",
      label: "Nama",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button
              className={`flex justify-start items-center gap-2 w-full p-2`}
            >
              {value.branchName}
            </button>
          );
        },
      },
    },
    {
      name: "data",
      label: "Alamat",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button
              className={`flex justify-start items-center gap-2 w-full p-2 `}
            >
              {value.address}
            </button>
          );
        },
      },
    },
    {
      name: "data",
      label: "Cabang Ke",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <button
              className={`flex justify-start items-center gap-2 w-full p-2 `}
            >
              Cabang Ke {value.value == "" ? "1" : value.value}
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
              <button
                className="Btn-see text-white"
                onClick={() => {
                  updateClick(value); // Kirim objek lengkap
                }}
              >
                <span className="svgContainer">
                  <RiPencilFill className="text-base " />
                </span>
                <span className="BG bg-emerald-500"></span>
              </button>
              <button
                className="Btn-see text-white"
                onClick={() => {
                  deleteCategory(value); // Kirim objek lengkap
                }}
              >
                <span className="svgContainer">
                  <MdDelete className="text-base " />
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
  const listData = dataCabang.map((data) => [
    data,
    data,
    data,
    data,
    data, // Tambahkan objek lengkap di sini
  ]);
  const optionCabang = [
    { value: "", text: "1" },
    { value: "2", text: "2" },
    { value: "3", text: "3" },
    { value: "4", text: "4" },
    { value: "5", text: "5" },
    { value: "6", text: "6" },
    { value: "7", text: "7" },
    { value: "8", text: "8" },
    { value: "9", text: "9" },
    { value: "10", text: "10" },
    { value: "11", text: "11" },
    { value: "12", text: "12" },
  ];
  return (
    <div ref={targetRef}>
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
              <h3 className="text-white text-base font-normal">List Cabang</h3>
            </div>
            <div className="w-full flex justify-start gap-10 items-center mt-10 h-full">
              <div
                data-aos="fade-up"
                data-aos-delay="250"
                className="cookieCard w-[40%]"
              >
                <div className="cookieDescription">
                  <h3 className="text-xl font-medium">
                    {dataCabang.length} Cabang
                  </h3>
                </div>
                <h3 className="text-xs font-normal text-white w-full">
                  Total Cabang
                </h3>
                <div className="z-[9999] absolute right-[5%] p-4 flex justify-center items-center bg-white rounded-full shadow-lg">
                  <FaLuggageCart className="text-blue-700 text-[2rem]" />
                </div>
              </div>
              <div
                data-aos="fade-up"
                data-aos-delay="250"
                className="cookieCard w-[40%]"
              >
                <div className="cookieDescription">
                  <h3 className="text-xl font-medium">
                    {" "}
                    Cabang{" "}
                    {getObjectString(
                      dataCabang,
                      sessionStorage.getItem("cabang")
                    )}
                  </h3>
                </div>
                <h3 className="text-xs font-normal text-white w-full">
                  Cabang Terpilih
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
                    setNama("");
                    setAlamat("");
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
                !isOpen ? "h-0 p-0" : "h-[16rem] p-2 mt-3"
              } duration-500 flex-col justify-start items-end rounded-md bg-white shadow-md`}
            >
              <div
                className={`w-full ${
                  !isOpen ? "hidden" : "flex"
                } justify-start items-center gap-4`}
              >
                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Nama</h4>
                  <input
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Alamat</h4>
                  <input
                    type="text"
                    value={alamat}
                    onChange={(e) => setAlamat(e.target.value)}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
                <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                  <h4 className="font-medium text-xs">Cabang Ke</h4>
                  <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                    <DropdownSearch
                      change={(data) => {
                        setCabang(data);
                        setRefresh(true);
                      }}
                      options={optionCabang}
                      refresh={refresh}
                      value={cabang}
                      name={"Cabang"}
                    />
                  </div>
                </div>
              </div>

              <div
                className={`w-full ${
                  !isOpen ? "hidden" : "flex"
                } justify-start items-center gap-4`}
              >
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
              // data-aos="fade-up"
              data-aos-delay="450"
              className="w-full flex justify-center items-start mt-5 h-[35rem] mb-28 "
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

export default MasterCabang;
