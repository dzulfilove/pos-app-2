import React, { useState } from "react";
import MUIDataTable from "mui-datatables";
import { Paper } from "@mui/material";
import "../../styles/button.css";

const TableDetailHistory = (props) => {
  const data = props.data.map((a) => {
    return {
      id: a.id,
      item: a.item.itemName, // Pastikan itemName ada dalam data item
      minStok: a.item.minStock,
      maxStok: a.item.maxStock,
      stok: a.stock,
      time: a.timeInput,
      status: a.status,
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

  const columns = [
    {
      name: "item",
      label: "Nama Barang",
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
      name: "stok",
      label: "Jumlah Barang",
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
      name: "time",
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
              {value}
            </button>
          );
        },
      },
    },
    {
      name: "status",
      label: "Status",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div
              className={`gap-2 w-full flex justify-center items-center p-2 rounded-xl ${
                value == "Stok Keluar"
                  ? "bg-yellow-200 border border-yellow-600 text-yellow-800"
                  : "bg-teal-100 border border-teal-700 text-teal-800"
              }`}
            >
              {value}
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
    <div className="w-full flex justify-center items-center mt-5 h-full mb-28">
      <Paper style={{ height: 400, width: "100%" }}>
        <MUIDataTable
          columns={columns}
          data={data}
          options={{
            fontSize: 12,
          }}
          pagination
          rowsPerPageOptions={[10, 50, { value: -1, label: "All" }]}
        />
      </Paper>
    </div>
  );
};

export default TableDetailHistory;
