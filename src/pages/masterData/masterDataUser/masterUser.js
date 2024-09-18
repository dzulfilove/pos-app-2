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
function MasterUser() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [isAdd, setIsAdd] = useState(true);
  const [isDetail, setIsDetail] = useState(false);
  const [dataDetail, setDataDetail] = useState({});
  const [peran, setPeran] = useState({});
  const [cabang, setCabang] = useState({});
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [indexDetail, setIndexDetail] = useState(0);
  const [dataUser, setDataUser] = useState([]);
  const [isLoad, setIsLoad] = useState(false);
  const [isData, setIsData] = useState(true);

  useEffect(() => {
    getAllUser();
  }, []);
  const getAllUser = async () => {
    try {
      // Ambil semua dokumen dari koleksi category
      const querySnapshot = await getDocs(collection(db, "users"));

      if (querySnapshot.empty) {
        console.log("Tidak ada kategori yang ditemukan.");
        return;
      }

      let usersData = [];
      const categoriesArray = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log(usersData, "user Daa");
      setDataUser(categoriesArray);
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
    if (!nama || !email || !peran || !cabang || !password) {
      let missingFields = [];
      if (!nama) missingFields.push("Nama");
      if (!email) missingFields.push("Email");
      if (!peran) missingFields.push("Peran");
      if (!cabang) missingFields.push("Cabang");
      if (!password) missingFields.push("Password");
      setIsLoad(false);

      Swal.fire(
        "Error",
        `${missingFields.join(" dan ")} tidak boleh kosong`,
        "error"
      );
      return;
    }
    try {
      // Daftar pengguna baru dengan email dan password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      // Ambil informasi pengguna yang baru dibuat
      const user = userCredential.user;

      // Simpan informasi ke sessionStorage
      sessionStorage.setItem("isLoggedIn", true);
      // sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("nama", nama);

      // sessionStorage.setItem("peran", peran);

      // Jika perlu, simpan informasi tambahan ke database, misalnya ke Firestore
      await saveUserData(user.uid, {
        email,
        nama,
        peran: peran.value,
        cabang: cabang.value,
      });
      setIsLoad(false);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Selamat, Anda Berhasil Mendaftar!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      setIsLoad(false);

      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Pendaftaran gagal. " + error.message,
        showConfirmButton: true,
      });
      console.log(error);
    }
  };

  // Fungsi untuk menyimpan data pengguna ke Firestore (jika diperlukan)
  const saveUserData = async (uid, userData) => {
    try {
      await setDoc(doc(db, "users", uid), userData); // Simpan data pengguna ke koleksi 'users'
    } catch (error) {
      console.log("Error saving user data:", error);
    }
  };
  const updateClick = (data) => {
    const selPeran = getObject(optionPeran, data.peran);
    const selcabang = getObject(optionCabang, data.cabang);
    setIsEdit(true);
    setIsOpen(true);
    setIsAdd(false);
    setIndexDetail(data.id);
    setNama(data.nama);
    setEmail(data.email);
    setPeran(selPeran[0]);
    setCabang(selcabang[0]);
  };
  const handleUpdate = async () => {
    const data = {
      nama,
      email,
      cabang,
      peran,
    };
    try {
      // Buat referensi ke dokumen kategori yang ingin diperbarui
      const categoryRef = doc(db, "users", indexDetail);

      // Perbarui data di Firestore
      await updateDoc(categoryRef, data);
      setNama("");
      setEmail("");
      setPeran({});
      setCabang({});
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
      getAllUser();
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
        const categoryRef = doc(db, "users", categoryId.id);

        // Hapus dokumen dari Firestore
        await deleteDoc(categoryRef);

        // Tampilkan alert sukses
        Swal.fire({
          title: "Sukses!",
          text: "Kategori berhasil dihapus.",
          icon: "success",
          confirmButtonText: "OK",
        });
        getAllUser();
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
            <button className="flex justify-start items-center gap-2 w-full">
              {value}
            </button>
          );
        },
      },
    },

    {
      name: "email",
      label: "Email",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "peran",
      label: "Peran",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "cabang",
      label: "Cabang",
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
  const getObject = (arr, item) => {
    return arr.find((x) => x.value === item);
  };
  const getObjectString = (arr, item) => {
    const res = arr.find((x) => x.value === item);
    return res.text;
  };
  const optionPeran = [
    { value: "Super Admin", text: "Super Admin" },
    { value: "Admin", text: "Admin" },
  ];
  const optionCabang = [
    { value: "", text: "Way Dadi 1" },
    { value: "2", text: "Way Dadi 2" },
  ];
  // Membuat listData tanpa menampilkan id
  const listData = dataUser.map((data) => [
    data.email,
    data.nama,
    data.peran,
    getObjectString(optionCabang, data.cabang),
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
                List Pengguna
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
                    {dataUser.length} Pengguna
                  </h3>
                </div>
                <h3 className="text-xs font-normal text-white w-full">
                  Total Pengguna
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
                    setEmail("");
                    setPassword("");
                    setDeskripsi("");
                    setPeran({});
                    setCabang({});
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
                !isOpen ? "h-0 p-0" : "h-[12rem] p-2 mt-3"
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
                  <h4 className="font-medium text-xs">Email</h4>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
                <div className="w-[33%] text-xs flex flex-col justify-start items-start p-2 gap-4">
                  <h4 className="font-medium text-xs">Password</h4>
                  <input
                    type="text"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full flex p-2 font-normal border-blue-500 border rounded-lg justify-start items-center h-[2rem]"
                  />
                </div>
              </div>{" "}
              <div
                className={`w-full ${
                  !isOpen ? "hidden" : "flex"
                } justify-start items-center gap-4`}
              >
                <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                  <h4 className="font-medium text-xs">Peran</h4>
                  <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                    <DropdownSearch
                      change={(data) => {
                        setPeran(data);
                      }}
                      options={optionPeran}
                      value={peran}
                      name={"Peran User"}
                    />
                  </div>
                </div>
                <div className="w-[33%] text-xs  flex flex-col justify-start items-start p-2  gap-4 ">
                  <h4 className="font-medium text-xs">Cabang</h4>
                  <div className="w-full flex p-2 bg-white font-normal border-blue-500 border rounded-lg justify-start text-xs items-center h-[2rem]">
                    <DropdownSearch
                      change={(data) => {
                        setCabang(data);
                      }}
                      options={optionCabang}
                      value={cabang}
                      name={"Kategori Barang"}
                    />
                  </div>
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

export default MasterUser;
