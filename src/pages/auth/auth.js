import React, { Component } from "react";
import "../../styles/card.css";
import { auth } from "../../config/database";
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import Swal from "sweetalert2";
import { FaArrowLeft } from "react-icons/fa6";
import { db } from "../../config/database";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
class Auth extends Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      password: "",
      nama: "",
      isDaftar: false,
      isLogin: false,
      userData: {},
    };
  }

  handleEmailChange = (event) => {
    this.setState({ email: event.target.value.toLowerCase() });
  };

  handlePasswordChange = (event) => {
    this.setState({ password: event.target.value });
  };

  issessionStorageAvailable = () => {
    try {
      const testKey = "__test__";
      sessionStorage.setItem(testKey, testKey);
      sessionStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  };
  getUserLogin = (email) => {
    return new Promise(async (resolve, reject) => {
      try {
        const userRef = collection(db, "users");
        const q = query(userRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          console.log("User tidak ditemukan.");
          resolve(null);
        } else {
          const userData = querySnapshot.docs[0].data();
          this.setState({ userData: userData }, () => resolve(userData));
        }
      } catch (error) {
        console.error("Error:", error);
        reject(error);
      }
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { email, password } = this.state;

    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Email dan password tidak boleh kosong.",
        showConfirmButton: true,
      });
      return;
    }

    try {
      const userData = await this.getUserLogin(email);

      if (!userData) {
        Swal.fire({
          icon: "error",
          title: "Gagal",
          text: "Email tidak ditemukan. Silakan periksa kembali.",
          showConfirmButton: true,
        });
        return;
      }

      const peran = userData.peran;
      await signInWithEmailAndPassword(auth, email, password);

      const cekStorage = this.issessionStorageAvailable();
      if (!cekStorage) {
        Swal.fire({
          icon: "warning",
          title: "sessionStorage is not available",
          text: "Please disable private browsing or use another browser.",
          showConfirmButton: false,
          timer: 1500,
        });
        return;
      }
      console.log(userData.nama);
      sessionStorage.setItem("isLoggedIn", true);
      sessionStorage.setItem("userEmail", email);
      sessionStorage.setItem("nama", userData.nama);
      sessionStorage.setItem("peran", userData.peran);
      sessionStorage.setItem("cabang", userData.cabang);

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Selamat, Anda Berhasil Masuk.",
        showConfirmButton: false,
        timer: 1500,
      });

      window.location.href = "/";
      console.log("Login successful");
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Anda Gagal Masuk, Periksa Kembali Password dan Email Anda.",
        showConfirmButton: false,
        timer: 1500,
      });
      console.log(error);
    }
  };

  handleForgetPass = async (e) => {
    e.preventDefault();
    const auth = getAuth();

    try {
      await sendPasswordResetEmail(auth, this.state.email);

      Swal.fire({
        icon: "success",
        title: "Peringatan",
        text: "Email reset password telah dikirim. Silahkan cek inbox Anda.",
        showConfirmButton: true,
      });
      console.log(null);
      this.setState({ isDaftar: false });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Gagal",
        text: "Kirim Password gagal. " + error.message,
        showConfirmButton: true,
      });
    }
  };

  handleSignUp = async (e) => {
    e.preventDefault();
    const { email, nama, password } = this.state; // Ambil email, password, dan peran dari state
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "Peringatan",
        text: "Harap lengkapi semua field sebelum mendaftar.",
        showConfirmButton: true,
      });
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
      sessionStorage.setItem("nama", this.state.nama);

      // sessionStorage.setItem("peran", peran);

      // Jika perlu, simpan informasi tambahan ke database, misalnya ke Firestore
      await this.saveUserData(user.uid, { email, nama });

      Swal.fire({
        icon: "success",
        title: "Berhasil",
        text: "Selamat, Anda Berhasil Mendaftar!",
        showConfirmButton: false,
        timer: 1500,
      });
      window.location.href = "/";
    } catch (error) {
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
  saveUserData = async (uid, userData) => {
    try {
      await setDoc(doc(db, "users", uid), userData); // Simpan data pengguna ke koleksi 'users'
    } catch (error) {
      console.log("Error saving user data:", error);
    }
  };

  render() {
    return (
      <div className="w-full h-[100vh] overflow-hidden  relative">
        <img
          src="https://images.unsplash.com/photo-1622126807280-9b5b32b28e77?q=80&w=2060&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          className="w-full h-[100vh] overflow-hidden absolute "
        />
        <div className="w-full flex flex-col pl-[5rem]  h-[100vh] overflow-hidden absolute bg-gradient-to-r from-slate-900/100 via-slate-900/90  to-slate-900/10">
          <div
            data-aos="fade-down"
            data-aos-delay="50"
            className="border-b pb-6 border-b-blue-500 ml-8 text-[3rem] text-slate-300 font-semibold mt-24 w-[44rem]"
          >
            <h1 className="text-2xl">Pos App Apin Cell</h1>
          </div>
          <div
            data-aos="fade-down"
            data-aos-delay="250"
            className=" h-[28rem] bg-opacity-80 p-10 mt-5 rounded-lg w-full max-w-md    flex justify-center flex-col items-center"
          >
            <div className="text-start  text-slate-300 mb-6 w-full">
              <h1 className="text-xl font-semibold">Masuk Akun</h1>
            </div>
            <form className="w-full text-sm">
              {/* {this.state.isDaftar && (
                <>
                  <div
                    data-aos="fade-down"
                    data-aos-delay="350"
                    className="mb-4 w-full"
                  >
                    <label className="block text-gray-400 mb-2 w-full">
                      Nama
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 h-14 rounded-xl bg-gray-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan Nama anda"
                      onChange={(e) => {
                        this.setState({ nama: e.target.value });
                      }}
                    />
                  </div>
                </>
              )} */}
              <div
                data-aos="fade-down"
                data-aos-delay="350"
                className="mb-4 w-full"
              >
                <label className="block text-gray-400 mb-2 w-full">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 h-14 rounded-xl bg-gray-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Masukkan Email anda"
                  onChange={this.handleEmailChange}
                />
              </div>
              {!this.state.isDaftar && (
                <>
                  <div
                    data-aos="fade-down"
                    data-aos-delay="450"
                    className="mb-6"
                  >
                    <label className="block text-gray-400 mb-2">Password</label>
                    <input
                      type="password"
                      className="w-full px-4 py-2 h-14 rounded-xl bg-gray-800 text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Masukkan Passoword Anda"
                      onChange={(e) => {
                        this.setState({ password: e.target.value });
                      }}
                    />
                  </div>
                </>
              )}

              <div className="flex w-full items-center justify-start gap-6">
                {this.state.isDaftar ? (
                  <>
                    {/* <button
                      data-aos="fade-down"
                      data-aos-delay="550"
                      className="button-login w-full font-bold"
                      onClick={(e) => {
                        this.handleSignUp(e);
                      }}
                    >
                      Buat Akun
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </button> */}
                  </>
                ) : (
                  <>
                    <button
                      data-aos="fade-down"
                      data-aos-delay="550"
                      className="button-login w-full font-bold"
                      onClick={this.handleSubmit}
                    >
                      Masuk
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </button>
                    {/* <button
                      data-aos="fade-down"
                      data-aos-delay="550"
                      className="button-login w-full font-bold"
                      onClick={() => {
                        this.setState({ isDaftar: true, isLogin: false });
                      }}
                    >
                      Daftar
                      <span></span>
                      <span></span>
                      <span></span>
                      <span></span>
                    </button> */}
                  </>
                )}
              </div>
              {!this.state.isDaftar && (
                <>
                  <button
                    data-aos="fade-down"
                    data-aos-delay="550"
                    className="button-login w-full font-bold mt-3"
                    onClick={(e) => {
                      e.preventDefault();
                      this.setState({ isDaftar: true });
                    }}
                  >
                    Lupa Password
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </button>
                </>
              )}
              {this.state.isDaftar && (
                <>
                  <button
                    data-aos="fade-down"
                    data-aos-delay="550"
                    className="button-login w-full font-bold mt-3"
                    onClick={(e) => {
                      e.preventDefault();
                      this.handleForgetPass(e);
                    }}
                  >
                    Kirim Email
                    <span></span>
                    <span></span>
                    <span></span>
                    <span></span>
                  </button>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    );
  }
}

export default Auth;
