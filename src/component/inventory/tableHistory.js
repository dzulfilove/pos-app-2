import React, { useState } from "react";
import MUIDataTable from "mui-datatables";
import { Paper, Button } from "@mui/material";
import "../../styles/button.css";
import { Link } from "react-router-dom";
import dayjs from "dayjs";
import { IoEyeSharp } from "react-icons/io5";

const TableHistory = (props) => {
  const formatTanggal = (value) => {
    const formattedDate = dayjs(value, "DD/MM/YYYY").format("D MMMM YYYY");
    return formattedDate;
  };
  const formatLink = (str) => {
    return str.replace(/\//g, "-");
  };
  const columns = [
    {
      name: "dateInput",
      label: "Tanggal Input",
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
              {formatTanggal(value)}
            </button>
          );
        },
      },
    },
    {
      name: "totalItem",
      label: "Jumlah Barang",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "stockIn",
      label: "Stok Masuk",
      options: {
        filter: true,
        sort: true,
      },
    },
    {
      name: "stockOut",
      label: "Stok Keluar",
      options: {
        filter: true,
        sort: true,
      },
    },

    {
      name: "dateInput",
      label: "Aksi",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-start gap-4 items-center">
              <Link
                className="Btn-see text-white"
                to={`/history-detail/${formatLink(value)}`}
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

  const handleDetailData = (rowIndex) => {
    console.log("Detail data for row:", rowIndex);
  };

  return (
    <div
      data-aos="fade-up"
      className="w-full flex justify-center items-center mt-5 h-[32rem]  mb-28"
    >
      <Paper style={{ height: 400, width: "100%" }}>
        <MUIDataTable
          columns={columns}
          data={props.data}
          options={{
            fontSize: 12,
          }}
        />
      </Paper>
    </div>
  );
};

export default TableHistory;
