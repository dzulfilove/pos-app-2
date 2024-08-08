import React from "react";
import MUIDataTable from "mui-datatables";

import { Paper, TablePagination, Button } from "@mui/material";

const TableData = () => {
  const handleEdit = (rowData) => {
    console.log("Edit", rowData);
    // implement edit logic here
  };

  const handleDelete = (rowData) => {
    console.log("Delete", rowData);
    // implement delete logic here
  };

  const columns = [
    { name: "Barcode", options: { filter: true, sort: true } },
    { name: "Nama", options: { filter: true, sort: true } },
    { name: "Harga", options: { filter: true, sort: true } },
    { name: "Kategori", options: { filter: true, sort: true } },
    {
      name: "Actions",
      options: {
        customBodyRender: (value, tableMeta, updateValue) => {
          return (
            <div className="flex justify-center items-center gap-2">
              <button
                className="text-[12px] py-2 px-4 bg-blue-600 text-white flex justify-center items-center rounded-md"
                onClick={() => handleEdit(tableMeta.rowData)}
              >
                Edit
              </button>
              <button
                className="text-[12px] py-2 px-4 bg-red-600 text-white flex justify-center items-center rounded-md"
                onClick={() => handleDelete(tableMeta.rowData)}
              >
                Hapus
              </button>
            </div>
          );
        },
      },
    },
  ];

  const data = [
    {
      Barcode: 10,

      Nama: "Barang 1",
      Harga: 10000,
      Kategori: "Elektronik",
    },
    {
      Barcode: 10,

      Nama: "Barang 2",
      Harga: 20000,

      Kategori: "Fashion",
    },
    {
      Barcode: 10,

      Nama: "Barang 3",
      Harga: 30000,

      Kategori: "Makanan",
    },
  ];
  return (
    <Paper style={{ height: 400, width: "100%" }}>
      <MUIDataTable
        columns={columns}
        data={data}
        options={{
          fontSize: 12, // adjust font size here
        }}
        pagination
        rowsPerPageOptions={[10, 50, { value: -1, label: "All" }]}
      />
    </Paper>
  );
};

export default TableData;
