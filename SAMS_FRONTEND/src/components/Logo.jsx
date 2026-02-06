import logo from '/Academia.png';

const Logo = ({ className = "h-10 w-auto", textClassName = "text-xl", subTextClassName = "text-[10px]", subtitle = "International College", collapsed = false }) => {
  return (
    <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} select-none transition-all duration-300`}>
      <img src={logo} alt="Academia Logo" className={`${className} object-contain`} />
      {!collapsed && (
        <div className="flex flex-col justify-center whitespace-nowrap overflow-hidden transition-opacity duration-300">
          <span className={`font-bold tracking-tight text-white uppercase leading-none ${textClassName}`}>
            Academia
          </span>
          <span className={`text-white/70 uppercase tracking-widest font-medium ${subTextClassName}`}>
            {subtitle}
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;
