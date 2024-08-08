import * as React from "react";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import { BarChart } from "@mui/x-charts/BarChart";
import { axisClasses } from "@mui/x-charts/ChartsAxis";

const formatRupiah = (angka) => {
  return angka.toLocaleString("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const chartSetting = {
  yAxis: [
    {
      label: "Total",
    },
  ],
  width: 830,
  height: 250,
  sx: {
    [`.${axisClasses.left} .${axisClasses.label}`]: {
      transform: "translate(-20px, 0)",
    },
  },
};

export default function BarChartComponent() {
  const [dataBulan, setDataBulan] = React.useState([
    { nama: "Jan.", text: "Januari", totalNominal: 100000, totalOrder: 120 },
    { nama: "Feb.", text: "Februari", totalNominal: 200000, totalOrder: 150 },
    { nama: "Mar.", text: "Maret", totalNominal: 300000, totalOrder: 180 },
    { nama: "Apr.", text: "April", totalNominal: 300000, totalOrder: 180 },
    { nama: "Mei", text: "Mei", totalNominal: 300000, totalOrder: 180 },
    { nama: "Juni", text: "Juni", totalNominal: 300000, totalOrder: 180 },
    { nama: "Juli", text: "Juli", totalNominal: 300000, totalOrder: 180 },
    { nama: "Agust.", text: "Agustus", totalNominal: 300000, totalOrder: 180 },
    { nama: "Sept.", text: "September", totalNominal: 300000, totalOrder: 180 },
    { nama: "Okto.", text: "Oktober", totalNominal: 300000, totalOrder: 180 },
    { nama: "Nov.", text: "November", totalNominal: 300000, totalOrder: 180 },
    { nama: "Des.", text: "Desember", totalNominal: 300000, totalOrder: 180 },
    // add more data here
  ]);

  const data = dataBulan.map(({ nama, text, totalNominal, totalOrder }) => ({
    name: nama,
    text: text,
    totalNominal: totalNominal / 1000,
    totalOrder,
  }));

  return (
    <div
      style={{ width: "100%" }}
      className="text-sm p-4 bg-white rounded-xl flex justify-center items-center shadow-sm"
    >
      <BarChart
        dataset={data}
        xAxis={[{ scaleType: "band", dataKey: "name" }]}
        series={[
          {
            dataKey: "totalOrder",
            label: "Total Barang",
            valueFormatter: (value) => `${value} Barang`,
          },
          {
            dataKey: "totalNominal",
            label: "Total Pendapatan",
            valueFormatter: (value) => `${formatRupiah(value)}`,
          },
        ]}
        {...chartSetting}
      />
    </div>
  );
}
