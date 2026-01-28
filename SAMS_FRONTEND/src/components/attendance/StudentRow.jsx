const StudentRow = ({
  student,
  status,
  onStatusChange,
  onRemarkChange,
  remark = "",
}) => {
  const statusOptions = [
    { value: "PRESENT", label: "Present", color: "green" },
    { value: "ABSENT", label: "Absent", color: "red" },
    { value: "LATE", label: "Late", color: "yellow" },
    { value: "EXCUSED", label: "Excused", color: "blue" },
  ];

  const getStatusColor = (status) => {
    const colors = {
      PRESENT: "bg-green-100 text-green-800",
      ABSENT: "bg-red-100 text-red-800",
      LATE: "bg-yellow-100 text-yellow-800",
      EXCUSED: "bg-blue-100 text-blue-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="p-4 text-sm">{student.rollNo || student.studentId}</td>
      <td className="p-4 text-sm font-medium">{student.name}</td>
      <td className="p-4">
        <div className="flex gap-1">
          {statusOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onStatusChange(student.id, option.value)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                status === option.value
                  ? getStatusColor(option.value)
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </td>
      <td className="p-4">
        <input
          type="text"
          value={remark}
          onChange={(e) => onRemarkChange(student.id, e.target.value)}
          placeholder="Add remark..."
          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </td>
    </tr>
  );
};

export default StudentRow;
