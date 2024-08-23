import { useState, useRef, useEffect } from "react";

export const TabBar = (props) => {
  const tabsRef = useRef([]);
  const [activeTabIndex, setActiveTabIndex] = useState(props.index || 0);
  const [tabUnderlineWidth, setTabUnderlineWidth] = useState(0);
  const [tabUnderlineLeft, setTabUnderlineLeft] = useState(0);

  useEffect(() => {
    const setTabPosition = () => {
      const currentTab = tabsRef.current[activeTabIndex];
      setTabUnderlineLeft(currentTab?.offsetLeft ?? 0);
      setTabUnderlineWidth(currentTab?.clientWidth ?? 0);
    };

    setTabPosition();
  }, [activeTabIndex]);

  const lengthData = props.data.length;
  const widthColumn = (100 / parseInt(lengthData)).toFixed(2);
  const widthTab = `w-[${props.width}%]`;
  const mainWidth = `${parseFloat(widthColumn) * lengthData - 3}%`;
  console.log(mainWidth, "panjang");
  console.log(widthColumn, "kecil");
  return (
    <div className="flex flex-row relative mx-auto  p-5 backdrop-blur-sm w-full justify-center ">
      <div
        style={{ width: mainWidth }}
        className={`flex flex-row  mx-auto absolute rounded-3xl bg-white py-6 top-[0.50rem] backdrop-blur-sm z-[-999] justify-center shadow-md`}
      ></div>

      <span
        className="absolute bottom-0 top-0 -z-10 flex overflow-hidden rounded-3xl py-2 transition-all duration-300"
        style={{ left: tabUnderlineLeft, width: tabUnderlineWidth }}
      >
        <span className="h-full w-full rounded-3xl bg-blue-600" />
      </span>
      {props.data.map((tab, index) => {
        const isActive = activeTabIndex === index;

        return (
          <button
            key={tab.id}
            ref={(el) => (tabsRef.current[index] = el)}
            style={{ width: mainWidth }}
            className={`${
              isActive ? `text-white ` : `  hover:text-blue-700`
            } my-auto cursor-pointer select-none rounded-full px-4 ${widthTab} text-center text-sm font-normal  `}
            onClick={() => {
              setActiveTabIndex(index);
              props.onTabChange(index);
            }}
          >
            {tab.name}
          </button>
        );
      })}
    </div>
  );
};
